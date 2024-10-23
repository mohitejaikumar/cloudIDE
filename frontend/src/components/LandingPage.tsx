import { useNavigate } from "react-router";


export default function LandingPage(){
    
    const navigate = useNavigate();
    
    function handleCreateIDE(){
        // logic to create IDE
        navigate('/ide');
    }



    return (
        <div className="w-scree h-screen flex justify-center items-center">
            <button className="px-2 py-1 rounded-lg bg-blue-500 text-white" onClick={handleCreateIDE}>
                Create IDE +
            </button>
        </div>
    )
}