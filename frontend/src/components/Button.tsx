import React from "react";




export default function Button({
    onClick,
    children
}:{
    onClick:()=>void,
    children:React.ReactNode
}){
    return (
        <button 
        className="cursor-pointer text-sm sm:text-lg px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 font-semibold rounded-full shadow-md hover:opacity-90"
        onClick={onClick}
        >
            {children}
        </button>
    )
}