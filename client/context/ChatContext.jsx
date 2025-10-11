import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";


export const ChatContext = createContext();

export const ChatProvider = ({ children })=>{

    const [messages , setMessages] = useState([]);
    const [users , setUsers] = useState([]);
    const [selectedUser , setSelectedUser] = useState(null);
    const [unseenMessages , setUnseenMessages] = useState(null);
    
    const {socket , axios} = useContext(AuthContext);

    //function to get all users for Sidebar

    const getUsers = async()=>{
        try {
            const { data } = await axios.get("/api/messages/users");
            if(data.success){
                setUsers(data.users);
                setUnseenMessages(data.unseenMessages);
            }
        } catch (e) {
            toast.error(e.message);
        }
    }

    // Get messages for selected user

    const getMessages = async(userId)=>{
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if(data.success){
                setMessages(data.messages);
            }
        } catch (e) {
            toast.error(e.message);
        }
    }

    // function to send message to selected user

    const sendMessage = async (messageData) => {
        try {
            const {data} = await axios.post(`/api/messages/send/${selectedUser._id}` , messageData);
            if(data.success){
                setMessages((prevMessages)=>[...prevMessages , data.newMessage])
            }else{
                toast.error(data.message);
            }
        } catch (e) {
            toast.error(e.message);
        }
    }

    // Function to subscribe to message to selected user

    const subscribeToMessages = async()=>{
        if(!socket) return;
        socket.on("newMessage" , (newMessage)=>{
            if (selectedUser && newMessage.senderId === selectedUser._id){
                newMessage.seen = true;
                setMessages((prevMessages)=> [...prevMessages , newMessage]);
                axios.put(`/api/messages/mark/${newMessage._id}`);
            }else{
                setUnseenMessages((prevUnseenMessages)=>({
                    ...prevUnseenMessages , [newMessage.senderId] : prevUnseenMessages[newMessage.senderId] ? prevUnseenMessages[newMessage.senderId] + 1 : 1
                }))
            }
        })
    }

    // Function to unsubscibe from messages

    const unsubscibeFromMessages = ()=>{
        if(socket) socket.off("newMessage");
    }

    useEffect(()=>{
        subscribeToMessages();
        return ()=> unsubscibeFromMessages();
    } ,[socket , selectedUser])

    const value = {
        messages , users , selectedUser , getUsers , getMessages , sendMessage , setSelectedUser , unseenMessages , setUnseenMessages
    }

    return (
    <ChatContext.Provider value={value}>
        { children }
    </ChatContext.Provider>
    )
}
