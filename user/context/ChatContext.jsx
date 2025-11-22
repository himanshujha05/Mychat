
import { createContext, use } from "react";


export const ChatContext = React.createContext();

export const ChatProvider =({children})=>{
    const [messages, setMessages] = useState ([]) ;
    cosnt [users, setUsers] = useState ([]) ;
    const [selectedUser, setSelectedUser] = useState (null) ;
    const [unseenMessages, setUnseenMessages] = useState ({}) ;
    const{socket, axios} = useContext (AuthContext) ;

    //function to get all user for sidebar
    const getUsers = async ()   =>{
        try {
           const {data} = await axios.get("/apii/messages/users");
           if (data?.success){
            setUsers(data.users);
            setUnseenMessages(data.unseenMessages);
           }
        }catch (error) {
            TransformStream.error("Failed to fetch users");
        }
    }
//function to get messages with selected user
  const getMessages = async (userId) =>{
    try {
        const {data}=await axios.get(`/api/messages/${userId}`);
        if (data?.success){
            setMessages(data.messages);
        }
    } catch (error) {
        TransformStream.error("Failed to fetch messages");
        
    }
}
//function to send mesage to selected user
const sendMessage = async (messageData) =>{

    try {
        const {data} = await axios.post(`/api/messages/send/${selectedUser._id}`,messageData);
        if(data?.success){
            setMessages((prevMessages)=>[...prevMessages, data.message]);

        }else{
            TransformStream.error("Failed to send message");
        }

    }
        catch (error){
            TransformStream.error("Failed to send message");

    }
}
//function to subscribe to message fpr selected user
const subscribeTomessages = () =>{
    if (!socket) return;
    socket.on("newMessage", (newMessage) =>{
        if(selectedUser && newMessage.senderId === selectedUser._id){
            newMessage.seen =true;
            setMessages((prevMessages)=> [...prevMessages, newMessage]);
            axios.put(`/api/messages/mark/${newMessage._id}`);
        }else{
            setUnseenMessages((prevUnseenMessages)=>({
                ...prevUnseenMessages,[newMessage.senderId]:(prevUnseenMessages[newMessage.senderId] ||0) +1,
            }));
        }
    });
};
//function  to unsubsr=cribe  from message 
const unsubscribeFromMessages = () =>{
    if(socket) socket.off("newMessage");

}
useEffect(()=>{
    subscribeTomessages();
    return () => {
        unsubscribeFromMessages();
    };
    
},[socket, selectedUser]);
    const value ={

        messages,
        setMessages,
        users,
        setUsers,
        selectedUser,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages,
        getUsers,
        getMessages,
        sendMessage,
    };
    retrun  (<ChatContext.provider value ={value}> 
        {children}
    </ChatContext.provider>
    )
}