
import fs from 'fs/promises';
import { IFileTree } from './types';



export const getAllFiles = async(dirPath:string):Promise<IFileTree>=>{
    
    let fileTree:IFileTree = {};
    const result = await fs.readdir(dirPath);
    for (const file of result){
        const filePath = dirPath + '/' + file;
        const stat = await fs.stat(filePath);
        if(stat.isDirectory()){
            fileTree[file] = {
                name:file,
                type:"dir",
                children: (await getAllFiles(filePath))
            };
        }
        else{
            fileTree[file] = {
                name:file,
                type:"file",
            }
        }
    }
    return fileTree;
}


export const getFilesIncrementally = async(dirPath:string , currentDir:string):Promise<IFileTree>=>{
    
    let fileTree:IFileTree = {};
    const result = await fs.readdir(dirPath);
    for (const file of result){
        const filePath = dirPath + '/' + file;
        const stat = await fs.stat(filePath);
        if(stat.isDirectory()){
            fileTree[file]  = {
                name:file,
                type:"dir",
                children: {},
            }
        }
        else{
            fileTree[file]={
                name:file,
                type:"file",
            }
        }
    }
    
    return {
        currentDir:{
            name:currentDir,
            type:"dir",
            children:fileTree
        }
    }
}