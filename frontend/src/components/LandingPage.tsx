import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router";


export default function LandingPage(){

    const [loading , setLoading] = useState(false);
    const [status , setStatus] = useState("Creating IDE Instance");
    
    const navigate = useNavigate();
    
    async function handleCreateIDE(){
        // logic to create IDE
        try{

            setLoading(true);
            const response = await axios.post('https://cloud-ide-broker.vercel.app/spin-ide');
            console.log(response.data);
            setStatus("Initializing IDE ...");
            await new Promise(resolve => setTimeout(resolve, 10000));
            try{
                const ip = await axios.post('https://cloud-ide-broker.vercel.app/get-ip',{
                    taskArn:response.data.taskArn
                });
                console.log(ip.data);
                navigate(`/ide/${ip.data}`);
                setLoading(false);
            }
            catch(error){
                console.log(error);
                setStatus("Failed to get IP");
            }
        }
        catch(error){
            console.log(error);
            setStatus("Failed to create IDE");
        }
        setLoading(false);
    }


    return (
        <div className="w-scree h-screen flex flex-col justify-center items-center">
            <button className="px-2 py-1 rounded-lg bg-blue-500 text-white" onClick={handleCreateIDE} disabled={loading}>
                Create IDE +
            </button>
            {loading &&<div>{status}</div>}
        </div>
    )
}