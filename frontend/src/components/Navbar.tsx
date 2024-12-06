import Button from "./Button";




export default function Navbar(){
    return (
        <nav className="flex justify-between items-center px-3 md:px-20 py-5 bg-transparent backdrop-blur-xl fixed top-0 right-0 left-0 z-50 md:rounded-b-full rounded-tl-none rounded-tr-none md:border-l-2 md:border-r-2 md:border-b-2 md:mx-10 lg:mx-32  shadow-md">
            <div className="text-white font-bold text-2xl">codeStream</div>
            <div className="flex gap-5 items-center font-semibold">
                <div
                    className="text-sm sm:text-lg text-white cursor-pointer"
                    onClick={()=>{
                        console.log("login")
                    }}
                >
                    Sign In
                </div>
                <Button
                    onClick={()=>{
                        console.log("login")
                    }}
                >
                    Sign Up
                </Button>
            </div>
        </nav>
    )
}