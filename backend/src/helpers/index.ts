
import fs from 'fs/promises';
import { IFileTree } from './types';
import path from 'path';
import { applyPatch } from 'diff';



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
        [currentDir]:{
            name:currentDir,
            type:"dir",
            children:fileTree
        }
    }
}

export function getFileLanguage(filePath:string) {
    const extension = path.extname(filePath);

    switch (extension) {
        case '.js':
            return 'JavaScript';
        case '.html':
            return 'HTML';
        case '.css':
            return 'CSS';
        case '.java':
            return 'Java';
        case '.py':
            return 'Python';
        case '.ts':
            return 'TypeScript';
        case '.php':
            return 'PHP';
        case 'c++':
            return 'CPP';
        case 'txt':
            return 'TXT'
        default:
            return 'Unknown Language';
    }
}

export async function appyPatchtoFile(filePath:string, patch:string){
    
    const originalFileContent = await fs.readFile(filePath);
    //@ts-ignore
    const patchedFileContent = applyPatch(originalFileContent.toString() , patch ,{ autoConvertLineEndings: true });
    if(patchedFileContent)
        await fs.writeFile(filePath , patchedFileContent);
    else{
        console.log("no........................................................")
    }
}