import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from "react";
import FileTree from "./FileTree";
import Terminal from "./Terminal";
import { IFileTree } from "../types";
import Editor from '@monaco-editor/react';
import {applyPatch, createPatch} from 'diff';
import useSocket from '../hook/useSocket';
import { useParams } from 'react-router';


export default function CloudIDE() {

    const editorRef = useRef(null);
    const params = useParams();
    const ip = params.id?.replace(/-/g, '.');
    const socket = useSocket(`wss://cloud-ide-ocdi.vercel.app/?path=${ip}:8080`);
    const [selectedFilePath , setSelectedFilePath] = useState<string | null>(null);
    const [selectedFileValue , setSelectedFileValue] = useState("");
    const [selectedFileLanguage , setSelectedFileLanguage] = useState("");
    const [code , setCode] = useState<string | null>(null);
    const [currentOpenDir , setCurrentOpenDir] = useState<string>("");
    

    
    const [fileTree , setFileTree] = useState<IFileTree>({
        'user':{
            name:'user',
            type:'dir',
            children:{}
        }
    });

    const updateFileTree = useCallback((index:number ,currentDirPath:string , finalDirPath:string , newDepthFileTree:IFileTree , currentFileTree:IFileTree)=>{
        
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
        
        
        Object.keys(currentFileTree).forEach(fileTreeItem=>{
            if(fileTreeItem === nextDir){
                newFileTree[parentDir].children = {...newFileTree[parentDir].children , ...updateFileTree(index+1 , currentDirPath + '/' +nextDir , finalDirPath , newDepthFileTree , currentFileTree[fileTreeItem].children || {})}
            }
            else{
                newFileTree[parentDir].children = {...newFileTree[parentDir].children , 
                    [fileTreeItem]:currentFileTree[fileTreeItem]
                }
            }
            
        })
        return newFileTree;
    },[]);

    const getFilesIncrementally = useCallback(async(dirPath:string)=>{
        setSelectedFilePath(null);
        const result = await axios.get(`https://cloud-ide-ocdi.vercel.app`,{
            headers:{
                'path':`${ip}:3000/files?dirPath=${dirPath}`
            }
        });
        const newFileTree = updateFileTree(2 , '/user' , dirPath , result.data , fileTree['user'].children || {});
        setFileTree(newFileTree);
    },[ip, updateFileTree, fileTree]);
    
    useEffect(()=>{
        if(socket==null) return;
        socket.onmessage = (event)=>{
            const payload = JSON.parse(event.data);
            
            switch(payload.type){
                case 'filePatch':
                {   
                    if(payload.filePath !== selectedFilePath) break;
                    const originalValue = selectedFileValue;
                    const patch = applyPatch(originalValue,payload.data);
                    
                    if(patch)
                        setSelectedFileValue(patch);
                    break; 
                }
                case 'unlinkDir':
                case ('addDir'):
                {
                    const path:string = payload.data;
                    const dirs = path.split('/');
                    
                    const startIndex = dirs.findIndex(item => item.includes('user'));
                    let finalPath = "";
                    // If 'user' is found, concatenate from that index onwards
                    if (startIndex !== -1) {
                        finalPath =  dirs.slice(startIndex,dirs.length -1).join('/');
                    }
                    
                    
                    getFilesIncrementally("/"+finalPath);
                    break;
                }
                case 'unlink':
                case 'add':
                {   
                    const path:string = payload.data;
                    const dirs = path.split('/');
                    
                    const startIndex = dirs.findIndex(item => item.includes('user'));
                    let finalPath = "";
                    // If 'user' is found, concatenate from that index onwards
                    if (startIndex !== -1) {
                        finalPath =  dirs.slice(startIndex,dirs.length -1).join('/');
                    }
                    
                    
                    getFilesIncrementally("/"+finalPath);
                    break;
                }
                default:
                    break;
            }
        }

    },[socket,selectedFileValue,selectedFilePath,getFilesIncrementally])

    useEffect(()=>{
        if(code === null) return;
        const timer = setTimeout(()=>{
            const patch = createPatch(selectedFilePath?.split('/').pop() || "temp.txt" , selectedFileValue , code);
            setSelectedFileValue(code);
            
            
            if(selectedFilePath === null){
                clearTimeout(timer);
                setCode(null);
                return;
            }
            
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
        
        if(!(typeof value === 'string')) return;
        
        setCode(value);
    }  



    const getFileContent = async(filePath:string)=>{
        setSelectedFilePath(filePath);
        
        const result = await axios.get(`https://cloud-ide-ocdi.vercel.app`,{
            headers:{
                'path':`${ip}:3000/file/content?filePath=${filePath}`
            }
        });
        
        setCode(null);
        setSelectedFileValue(result.data.content);
        setSelectedFileLanguage(result.data.language);
        
    }

    
    return (
        <div className="w-screen h-screen overflow-hidden">
            <div className="h-[65%] w-full flex ">
                <div className="w-[17%] bg-slate-800 h-full overflow-y-auto custom-scrollbar pb-6">
                    <FileTree
                        fileTree={fileTree}
                        getFilesIncrementally={getFilesIncrementally}
                        currentDir={''}
                        isOpen={false}
                        getFileContent={getFileContent}
                        currentOpenDir={currentOpenDir}
                        setCurrentOpenDir={setCurrentOpenDir}
                    />
                </div>
                <div className="h-full w-[83%]">
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
            <Terminal url={`wss://cloud-ide-ocdi.vercel.app/?path=${ip}:8080`} />
        </div>
    )
}