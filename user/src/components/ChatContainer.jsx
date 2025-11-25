 import React, { useEffect, useState, useContext, useRef } from 'react'
import assets from '../assets/assets'
import { formatMessageTime } from '../library/utils'
import { AuthContext } from '../../context/AuthContext'
import { ChatContext } from '../../context/ChatContext'
import toast from 'react-hot-toast'
 
 const ChatContainer = () => {
    const chatContext = useContext(ChatContext);
    const authContext = useContext(AuthContext);
    
    const { messages = [], selectedUser, setSelectedUser, sendMessage, getMessages, typingUsers = {} } = chatContext || {};
    const { authUser, onlineUser = [], socket } = authContext || {};


     const scrollEnd = useRef()
     const typingTimeoutRef = useRef(null);
     const [input, setInput] = useState('');
    
    // Handle input change with typing indicator
    const handleInputChange = (e) => {
        setInput(e.target.value);
        
        if (socket && selectedUser) {
            socket.emit('typing', { receiverId: selectedUser._id });
            
            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            
            // Set new timeout to stop typing after 2 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('stop-typing', { receiverId: selectedUser._id });
            }, 2000);
        }
    };
    
    //Handle send message 
     const handleSendMessage =async(e) =>{

      e.preventDefault();
      if(input.trim() === '') return null;
      
      // Stop typing indicator
      if (socket && selectedUser) {
          socket.emit('stop-typing', { receiverId: selectedUser._id });
      }
      if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
      }
      
      await sendMessage({text: input.trim()});
      setInput ('');
     }
     //handle send image 
      const handleSendImage = async (e) =>{
        const file = e.target.files[0];
        if(!file|| !file.type.startsWith('image/')) {
          toast.error("Please select a valid image file.");
          return;
        }
        const reader = new FileReader();
        reader.onloadend =async ()=>{
          await sendMessage({image: reader.result});
          e.target.value = null; //reset file input
        }
        reader.readAsDataURL(file);
      }
      useEffect (()=>{
        if(selectedUser){
          getMessages (selectedUser._id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      },[selectedUser]);


     useEffect(()=>{
           if(scrollEnd.current && messages ){
            scrollEnd.current.scrollIntoView({behavior: "smooth"})
           
           }
     },[messages])

   return selectedUser ? (
     <div className='h-full overflow-scroll relative backdrop-blur-lg'>
      {/*----header------*/}
      <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500'>
        
      <img src={selectedUser?.profilePic || assets.avatar_icon} alt="" className = "w-10 h-10 rounded-full object-cover"/>
      <div className='flex-1'>
        <p className='text-lg text-white font-medium flex items-center gap-2'>
         {selectedUser?.fullName || 'User'}
         {onlineUser?.includes(selectedUser?._id) && (
           <span className="flex items-center gap-1 text-xs text-green-400 font-normal">
             <span className="w-2 h-2 rounded-full bg-green-500"></span>
             Active
           </span>
         )}
        </p>
        {typingUsers?.[selectedUser?._id] && (
          <p className='text-xs text-gray-400 italic'>typing...</p>
        )}
      </div>
        <img onClick={()=>setSelectedUser(null)} src={assets.arrow_icon} alt=""className='md:hidden max-w-7 cursor-pointer' />
        <img src={assets.help_icon} alt=""className='max-md:hidden max-w-5 opacity-50' />
      </div>
      {/*---chat Area*/}
      <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6'>
        
          {messages && messages.length > 0 ? messages.map((msg, index)=>{
            const isMine = msg.senderId === authUser?._id;
            return (
            <div key={msg._id || index} className={`flex items-start gap-2 mb-4 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <img 
                src={isMine ? (authUser?.profilePic || assets.avatar_icon) : (selectedUser?.profilePic || assets.avatar_icon)} 
                alt="" 
                className='w-8 h-8 rounded-full flex-shrink-0'
              />
              
              {/* Message Content */}
              <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[70%]`}>
                {msg.image ? (
                  <img 
                    src={msg.image} 
                    alt="" 
                    className='max-w-[250px] border border-gray-700 rounded-lg cursor-pointer hover:opacity-90'
                    onClick={() => window.open(msg.image, '_blank')}
                  />
                ) : (
                  <div className={`p-3 rounded-2xl ${isMine ? 'bg-violet-600 rounded-tr-none' : 'bg-gray-700 rounded-tl-none'}`}>
                    <p className='text-white text-sm break-words'>{msg.text}</p>
                  </div>
                )}
                {/* Timestamp */}
                <p className='text-gray-500 text-xs mt-1 px-1'>
                  {formatMessageTime(msg.createdAt)}
                </p>
              </div>
            </div>
          )})
          : (
            <div className='flex items-center justify-center h-full text-gray-400'>
              <p>No messages yet. Start the conversation!</p>
            </div>
          )}
        <div ref={scrollEnd}></div>
      </div>
     {/*-------------bottom area---------*/}
     <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-4 bg-[#1a1a2e]/90 backdrop-blur-md border-t border-gray-700'>
      <div className='flex-1 flex items-center bg-gray-800 px-4 py-2 rounded-full'>
        <input 
          onChange={handleInputChange} 
          value={input}
          onKeyDown={(e)=>e.key === "Enter" && !e.shiftKey ? handleSendMessage(e) : null}
          type="text" 
          placeholder="Type a message..."
          className='flex-1 text-sm py-1 bg-transparent border-none outline-none text-white placeholder-gray-400'
        />
        <input onChange={handleSendImage} type="file" id='image' accept='image/png, image/jpeg' hidden/>
        <label htmlFor="image" className='cursor-pointer'>
          <img src={assets.gallery_icon} alt="" className="w-5 hover:opacity-70 transition-opacity" />
        </label>
      </div>
      <button 
        onClick={handleSendMessage} 
        className='bg-violet-600 hover:bg-violet-700 p-3 rounded-full transition-colors'
      >
        <img src={assets.send_button} alt="" className="w-5 h-5" />
      </button>
     </div>




     </div>
   ) :(
    <div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden'>
      <img src={assets.logo_icon} className='max-w-16'alt="" />
      <p className='text-lg font-medium text-white'>
        Chat anytime, anywhere
      </p>
    </div>
   )
 }
 
 export default ChatContainer
 