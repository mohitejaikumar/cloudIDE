import axios from 'axios';
import { useState } from "react";
import FileTree from "./FileTree";
import Terminal from "./Terminal";
import { IFileTree } from "../types";

export default function CloudIDE() {

    const [fileTree , setFileTree] = useState<IFileTree>({
        'user':{
            name:'user',
            type:'dir',
            children:{}
        }
    });


    function updateFileTree(index:number ,currentDirPath:string , finalDirPath:string , newDepthFileTree:IFileTree , currentFileTree:IFileTree){
        
        if(currentDirPath === finalDirPath){
            return newDepthFileTree;
        }
        const nextDir = finalDirPath.split('/')[index];
        let newFileTree = {};
        Object.keys(currentFileTree).forEach(fileTreeItem=>{
            if(fileTreeItem === nextDir){
                newFileTree = {...newFileTree , ...updateFileTree(index+1 , currentDirPath + '/' +nextDir , finalDirPath , newDepthFileTree , currentFileTree[fileTreeItem].children || {})}
            }
            else{
                newFileTree = {...newFileTree , ...currentFileTree[fileTreeItem]}
            }
        })
        console.log(index , currentDirPath , finalDirPath , newDepthFileTree , currentFileTree);
        return newFileTree;
    }

    const getFilesIncrementally = async(dirPath:string)=>{
        const result = await axios.get('http://localhost:3000/files?dirPath='+dirPath);
        setFileTree(updateFileTree(1 , '/user' , dirPath , result.data , fileTree));
        console.log(fileTree);
    }

    return (
        <div className="w-screen h-screen overflow-hidden">
            <div className="h-[60%] w-full flex ">
                <div>
                    <FileTree
                        fileTree={fileTree}
                        getFilesIncrementally={getFilesIncrementally}
                        currentDir=''
                        isOpen={false}
                    />
                </div>
                <div>

                </div>
            </div>
            <Terminal />
        </div>
    )
}