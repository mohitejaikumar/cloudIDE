import { useState } from "react";
import { IFileTree } from "../types"



export default function FileTree({
    fileTree,
    isOpen,
    getFilesIncrementally,
    currentDir,
}:{
    fileTree:IFileTree,
    isOpen:boolean,
    getFilesIncrementally:(dirPath:string)=>void,
    currentDir:string
}){
    

    return (
        <div>
            { fileTree &&
                Object.values(fileTree).map((fileTreeItem , index)=>{
                    return (
                        <>
                            { (fileTreeItem.type === "dir" ?
                                <>  
                                <Subtree
                                    fileTreeItem={fileTreeItem}
                                    index={index}
                                    children={fileTree[fileTreeItem.name].children || {}}
                                    getFilesIncrementally={getFilesIncrementally}
                                    currentDir={currentDir}
                                    isOpen={isOpen}
                                />
                                </>
                                :
                                <>
                                    <div key={index} className="pl-2 py-1 bg-gray-400  cursor-pointer" >
                                        {fileTreeItem.name}
                                    </div>
                                </>
                            )}
                        </>
                    )
                })
            }
        </div>
    )
}


function Subtree({
    fileTreeItem,
    index,
    children,
    getFilesIncrementally,
    currentDir,
    isOpen,

}:{
    fileTreeItem:{
        name:string,
        type:'dir' | 'file'
        children?:IFileTree
    },
    index:number,
    children:IFileTree,
    getFilesIncrementally:(dirPath:string)=>void,
    currentDir:string,
    isOpen:boolean
}){
    const [open , setOpen] = useState(isOpen);
    const handleOnClick = (dirname:string)=>{
        console.log(dirname , currentDir);
        if(!open){
            getFilesIncrementally(currentDir+'/'+dirname);
        }
        setOpen(!open);
    }

    return (
        <div key={index} className="pl-2 w-full">
            <div className="pl-2 py-1 w-full items-center bg-gray-500 m-1 cursor-pointer flex gap-3" onClick={()=>handleOnClick(fileTreeItem.name)}>
                <div>{(open) ? "v" : ">"}</div> 
                <div>{ fileTreeItem.name}</div> 
            </div>
            {open && <FileTree
                fileTree={children || {}}
                isOpen={false}
                getFilesIncrementally={getFilesIncrementally}
                currentDir={currentDir + "/" + fileTreeItem.name}
            />}
        </div>
    )
}



