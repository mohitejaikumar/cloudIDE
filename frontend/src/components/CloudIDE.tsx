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
        const parentDir = finalDirPath.split('/')[index-1];
        const newFileTree:IFileTree = {
            [parentDir]:{
                name:parentDir,
                type:'dir',
                children:{}
            }
        };
        console.log(index , currentDirPath , finalDirPath , newDepthFileTree , newFileTree);
        console.log(nextDir);
        Object.keys(currentFileTree).forEach(fileTreeItem=>{
            if(fileTreeItem === nextDir){
                newFileTree[parentDir].children = {...newFileTree[parentDir].children , ...updateFileTree(index+1 , currentDirPath + '/' +nextDir , finalDirPath , newDepthFileTree , currentFileTree[fileTreeItem].children || {})}
            }
            else{
                newFileTree[parentDir].children = {...newFileTree[parentDir].children , 
                    [fileTreeItem]:currentFileTree[fileTreeItem]
                }
            }
            console.log(newFileTree);
        })
        return newFileTree;
    }

    const getFilesIncrementally = async(dirPath:string)=>{
        const result = await axios.get('http://localhost:3000/files?dirPath='+dirPath);
        const newFileTree = updateFileTree(2 , '/user' , dirPath , result.data , fileTree['user'].children || {});
        setFileTree(newFileTree);
        console.log(fileTree);
    }

    return (
        <div className="w-screen h-screen overflow-hidden">
            <div className="h-[60%] w-full flex ">
                <div className="w-1/6 bg-slate-800 h-full overflow-y-auto custom-scrollbar">
                    <FileTree
                        fileTree={fileTree}
                        getFilesIncrementally={getFilesIncrementally}
                        currentDir={''}
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