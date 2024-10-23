import { useEffect, useRef, useState } from "react";
import { IFileTree } from "../types"



export default function FileTree({
    fileTree,
    isOpen,
    getFilesIncrementally,
    currentDir,
    getFileContent,
    currentOpenDir,
    setCurrentOpenDir
}:{
    fileTree:IFileTree,
    isOpen:boolean,
    getFilesIncrementally:(dirPath:string)=>void,
    currentDir:string,
    getFileContent:(filePath:string)=>void,
    currentOpenDir:string,
    setCurrentOpenDir:React.Dispatch<React.SetStateAction<string>>
}){
    
    const [childOpen , setChildOpen] = useState<boolean>(isOpen);

    useEffect(()=>{
        if(currentDir === currentOpenDir){
            setChildOpen(false);
        }
        else{
            setChildOpen(currentOpenDir.startsWith(currentDir));
        }
        console.log("..................................................." , currentDir , currentOpenDir , currentOpenDir.startsWith(currentDir));
    },[currentOpenDir,currentDir])

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
                                    isOpen={childOpen}
                                    getFileContent={getFileContent}
                                    currentOpenDir={currentOpenDir}
                                    setCurrentOpenDir={setCurrentOpenDir}
                                />
                                </>
                                :
                                <>
                                    <div 
                                        key={index} 
                                        className="w-full ml-3 px-2 py-1 my-1 bg-gray-400  cursor-pointer"
                                        onClick={()=>{getFileContent(currentDir + '/' + fileTreeItem.name)}}
                                    >   
                                        
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
    getFileContent,
    currentOpenDir,
    setCurrentOpenDir
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
    isOpen:boolean,
    getFileContent:(filePath:string)=>void,
    currentOpenDir:string,
    setCurrentOpenDir:React.Dispatch<React.SetStateAction<string>>
}){
    const [open , setOpen] = useState(isOpen);
    const [hover , setHover] = useState(false);
    const folderRef = useRef<HTMLDivElement>(null);
    console.log("hi from subtree " , isOpen);
    const handleOnClick = (dirname:string)=>{
        console.log(dirname , currentDir);
        
        if(!open){
            getFilesIncrementally(currentDir+'/'+dirname);
        }
        setCurrentOpenDir(currentDir+'/'+dirname);
        setOpen(!open);
    }


    useEffect(()=>{
        if(folderRef.current === null) return;
        folderRef.current?.addEventListener('mouseenter',()=>{
            setHover(true);
        })
        folderRef.current?.addEventListener('mouseleave',()=>{
            setHover(false);
        })
    },[]);

    return (
        <div key={index} className="pl-2 w-full">
            <div ref={folderRef} className="pl-2 pr-2 py-1 w-full items-center bg-gray-500 m-1 cursor-pointer flex justify-between" onClick={()=>handleOnClick(fileTreeItem.name)}>
                <div className="flex items-center gap-3">
                    <div>{(open) ? "v" : ">"}</div> 
                    <div>{ fileTreeItem.name}</div>
                </div>
                { hover && 
                    <div className="flex items-center gap-2">
                        {/* <Folder />
                        <Files /> */}
                    </div>
                }
            </div>
            {open && <FileTree
                fileTree={children || {}}
                isOpen={false}
                getFilesIncrementally={getFilesIncrementally}
                currentDir={currentDir + "/" + fileTreeItem.name}
                getFileContent={getFileContent}
                currentOpenDir={currentOpenDir}
                setCurrentOpenDir={setCurrentOpenDir}
            />}
        </div>
    )
}



