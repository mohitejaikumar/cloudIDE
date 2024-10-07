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
    const [open , setOpen] = useState(isOpen);

    const handleOnClick = (dirname:string)=>{
        if(!open){
            getFilesIncrementally(currentDir+'/'+dirname);
        }
        setOpen(!open);
    }

    return (
        <div>
            { fileTree &&
                Object.values(fileTree).map((fileTreeItem , index)=>{
                    return (
                        <>
                            { (fileTreeItem.type === "dir" ?
                                <>  
                                <div key={index} className="px-2">
                                    <div className="px-2 py-1 bg-slate-500 m-1" onClick={()=>handleOnClick(fileTreeItem.name)}>
                                        {fileTreeItem.name}
                                    </div>
                                    {open && <FileTree
                                        fileTree={fileTree[fileTreeItem.name].children || {}}
                                        isOpen={open}
                                        getFilesIncrementally={getFilesIncrementally}
                                        currentDir={currentDir + "/" + fileTreeItem.name}
                                    />}
                                </div>
                                </>
                                :
                                <>
                                    <div key={index} className="px-2 py-1 bg-slate-600 m-1" >
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



