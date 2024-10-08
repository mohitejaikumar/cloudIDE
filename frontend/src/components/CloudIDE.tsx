import axios from 'axios';
import { useEffect, useRef, useState } from "react";
import FileTree from "./FileTree";
import Terminal from "./Terminal";
import { IFileTree } from "../types";
import Editor from '@monaco-editor/react';
import {applyPatch, createPatch} from 'diff';
import useSocket from '../hook/useSocket';


export default function CloudIDE() {

    const editorRef = useRef(null);
    const socket = useSocket();
    const [selectedFilePath , setSelectedFilePath] = useState<string | null>(null);
    const [selectedFileValue , setSelectedFileValue] = useState("");
    const [selectedFileLanguage , setSelectedFileLanguage] = useState("");
    const [code , setCode] = useState(null);

    const [fileTree , setFileTree] = useState<IFileTree>({
        'user':{
            name:'user',
            type:'dir',
            children:{}
        }
    });
    
    useEffect(()=>{
        if(socket==null) return;
        socket.onmessage = (event)=>{
            const payload = JSON.parse(event.data);
            console.log(payload);
            console.log("selectedPath" , selectedFilePath);
            switch(payload.type){
                case 'filePatch':
                {   
                    if(payload.filePath !== selectedFilePath) break;
                    const originalValue = selectedFileValue;
                    const patch = applyPatch(originalValue,payload.data);
                    console.log("isSuccess" , patch);
                    if(patch)
                        setSelectedFileValue(patch);
                    break; 
                }
                default:
                    break;
            }
        }

    },[socket,selectedFileValue,selectedFilePath])

    useEffect(()=>{
        if(code === null) return;
        const timer = setTimeout(()=>{
            const patch = createPatch(selectedFilePath?.split('/').pop() || "temp.txt" , selectedFileValue , code);
            setSelectedFileValue(code);
            // console.log(patch);
            socket?.send(JSON.stringify({
                type:'filePatch',
                data:patch,
                filePath:selectedFilePath
            }))
        },1000);

        return ()=>{
            clearTimeout(timer);
        }

    },[code,selectedFileValue,selectedFilePath,socket])




    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function handleEditorDidMount(editor:any,) {
        editorRef.current = editor;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function handleEditorValidation(markers:any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
        markers.forEach((marker:any) => console.log('onValidate:', marker.message));
    } 

    function handleEditorChange(value:string | undefined,) {
        console.log('here is the current model value:', value);
        if(!(typeof value === 'string')) return;
        setCode(value);
    }  


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

    const getFileContent = async(filePath:string)=>{
        setSelectedFilePath(filePath);
        const result = await axios.get('http://localhost:3000/file/content?filePath='+filePath);
        console.log(result.data);
        setSelectedFileValue(result.data.content);
        setSelectedFileLanguage(result.data.language);
        
    }

    
    return (
        <div className="w-screen h-screen overflow-hidden">
            <div className="h-[65%] w-full flex ">
                <div className="w-1/6 bg-slate-800 h-full overflow-y-auto custom-scrollbar">
                    <FileTree
                        fileTree={fileTree}
                        getFilesIncrementally={getFilesIncrementally}
                        currentDir={''}
                        isOpen={false}
                        getFileContent={getFileContent}
                    />
                </div>
                <div className="h-full w-full">
                    <Editor
                        height="100%"
                        theme="vs-dark"
                        defaultLanguage={selectedFileLanguage}
                        defaultValue={selectedFileValue}
                        language={selectedFileLanguage.toLowerCase()}
                        value={selectedFileValue}
                        onMount={handleEditorDidMount}
                        onValidate={handleEditorValidation}
                        onChange={handleEditorChange}
                    />
                </div>
            </div>
            <Terminal />
        </div>
    )
}