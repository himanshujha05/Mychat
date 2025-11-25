
import React, { createContext, useState, useContext, useEffect } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "./AuthContext";

export const ChatContext = createContext();

export const ChatProvider =({children})=>{
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});
    const [typingUsers, setTypingUsers] = useState({});
    const authContext = useContext(AuthContext);
    const socket = authContext?.socket;
    const axios = authContext?.axios;

    //function to get all user for sidebar
    const getUsers = async ()   =>{
        if (!axios) return;
        try {
           const {data} = await axios.get("/api/messages/users");
           if (data?.success){
            setUsers(data.filteredUsers || data.users || []);
            setUnseenMessages(data.unseenMessages || {});
           }
        }catch (error) {
            toast.error("Failed to fetch users");
        }
    }
//function to get messages with selected user
  const getMessages = async (userId) =>{
    if (!axios) return;
    try {
        const {data}=await axios.get(`/api/messages/${userId}`);
        if (data?.success){
            setMessages(data.messages);
        }
    } catch (error) {
        toast.error("Failed to fetch messages");
        
    }
}
//function to send mesage to selected user
const sendMessage = async (messageData) =>{
    if (!axios) return;
    try {
        const {data} = await axios.post(`/api/messages/send/${selectedUser._id}`,messageData);
        if(data?.success){
            setMessages((prevMessages)=>[...prevMessages, data.newMessage]);

        }else{
            toast.error("Failed to send message");
        }

    }
        catch (error){
            toast.error("Failed to send message");

    }
}
//function to subscribe to message fpr selected user
const subscribeToMessages = () =>{
    if (!socket) return;
    
    try {
        socket.off("new-message");
        socket.off("user-typing");
        socket.off("user-stop-typing");
        
        socket.on("user-typing", ({ userId }) => {
            setTypingUsers(prev => ({ ...prev, [userId]: true }));
        });
        
        socket.on("user-stop-typing", ({ userId }) => {
            setTypingUsers(prev => ({ ...prev, [userId]: false }));
        });
        
        socket.on("new-message", (newMessage) =>{
            // Only update messages if viewing conversation with this user
            if (selectedUser && (newMessage.senderId === selectedUser._id || newMessage.receiverId === selectedUser._id)) {
                setMessages((prevMessages)=> {
                    // Check if message already exists to avoid duplicates
                    const exists = prevMessages.some(msg => msg._id === newMessage._id);
                    if (exists) return prevMessages;
                    
                    return [...prevMessages, newMessage];
                });
            }
            
            // Update unseen count only if NOT viewing that conversation
            if (!selectedUser || (newMessage.senderId !== selectedUser._id)) {
                setUnseenMessages((prevUnseenMessages)=>({
                    ...prevUnseenMessages,
                    [newMessage.senderId]:(prevUnseenMessages[newMessage.senderId] || 0) + 1,
                }));
            }
            
            // Mark as seen if from current selected user
            if(axios && selectedUser && newMessage.senderId === selectedUser._id){
                axios.put(`/api/messages/mark/${newMessage._id}`).catch(() => {});
            }
        });
    } catch (error) {
        console.error("Socket subscription error:", error);
    }
};
//function  to unsubscribe from message 
const unsubscribeFromMessages = () =>{
    if(socket) {
        socket.off("new-message");
        socket.off("user-typing");
        socket.off("user-stop-typing");
    }
}
useEffect(()=>{
    subscribeToMessages();
    return () => {
        unsubscribeFromMessages();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
},[socket, selectedUser]);
    const value ={
        messages: messages || [],
        setMessages,
        users: users || [],
        setUsers,
        selectedUser,
        setSelectedUser,
        unseenMessages: unseenMessages || {},
        setUnseenMessages,
        typingUsers: typingUsers || {},
        getUsers,
        getMessages,
        sendMessage,
    };
    return  (<ChatContext.Provider value ={value}> 
        {children}
    </ChatContext.Provider>
    )
}