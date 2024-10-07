export interface IFileTree{
    [key:string]:{
        name:string,
        type:"file" | "dir",
        children?:IFileTree
    }
}