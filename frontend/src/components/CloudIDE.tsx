import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import FileTree from "./FileTree";
import Terminal from "./Terminal";
import { IFileTree } from "../types";
import Editor from "@monaco-editor/react";
import { applyPatch, createPatch } from "diff";
import useSocket from "../hook/useSocket";
import { useParams } from "react-router";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./ui/resizable";
import Button from "./Button";

export default function CloudIDE() {
  const editorRef = useRef(null);
  const params = useParams();
  const ip = params.id?.replace(/-/g, ".");
  const socket = useSocket(`${import.meta.env.VITE_WS_URL}/?path=${ip}:8080`);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [selectedFileValue, setSelectedFileValue] = useState("");
  const [selectedFileLanguage, setSelectedFileLanguage] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [currentOpenDir, setCurrentOpenDir] = useState<string>("");
  const [initStreaming, setInitStreaming] = useState(false);
  const [myMirror, setMyMirror] = useState<MediaStreamTrack | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const videoDivRef = useRef<HTMLDivElement>(null);

  const [fileTree, setFileTree] = useState<IFileTree>({
    user: {
      name: "user",
      type: "dir",
      children: {},
    },
  });

  const updateFileTree = useCallback(
    (
      index: number,
      currentDirPath: string,
      finalDirPath: string,
      newDepthFileTree: IFileTree,
      currentFileTree: IFileTree
    ) => {
      if (currentDirPath === finalDirPath) {
        return newDepthFileTree;
      }
      const nextDir = finalDirPath.split("/")[index];
      const parentDir = finalDirPath.split("/")[index - 1];
      const newFileTree: IFileTree = {
        [parentDir]: {
          name: parentDir,
          type: "dir",
          children: {},
        },
      };

      Object.keys(currentFileTree).forEach((fileTreeItem) => {
        if (fileTreeItem === nextDir) {
          newFileTree[parentDir].children = {
            ...newFileTree[parentDir].children,
            ...updateFileTree(
              index + 1,
              currentDirPath + "/" + nextDir,
              finalDirPath,
              newDepthFileTree,
              currentFileTree[fileTreeItem].children || {}
            ),
          };
        } else {
          newFileTree[parentDir].children = {
            ...newFileTree[parentDir].children,
            [fileTreeItem]: currentFileTree[fileTreeItem],
          };
        }
      });
      return newFileTree;
    },
    []
  );

  const getFilesIncrementally = useCallback(
    async (dirPath: string) => {
      setSelectedFilePath(null);
      const result = await axios.get(`${import.meta.env.VITE_API_URL}`, {
        headers: {
          path: `${ip}:3000/files?dirPath=${dirPath}`,
        },
      });
      const newFileTree = updateFileTree(
        2,
        "/user",
        dirPath,
        result.data,
        fileTree["user"].children || {}
      );
      setFileTree(newFileTree);
    },
    [ip, updateFileTree, fileTree]
  );

  useEffect(() => {
    if (socket == null) return;
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);

      switch (payload.type) {
        case "filePatch": {
          if (payload.filePath !== selectedFilePath) break;
          const originalValue = selectedFileValue;
          const patch = applyPatch(originalValue, payload.data);

          if (patch) setSelectedFileValue(patch);
          break;
        }
        case "unlinkDir":
        case "addDir": {
          const path: string = payload.data;
          const dirs = path.split("/");

          const startIndex = dirs.findIndex((item) => item.includes("user"));
          let finalPath = "";
          // If 'user' is found, concatenate from that index onwards
          if (startIndex !== -1) {
            finalPath = dirs.slice(startIndex, dirs.length - 1).join("/");
          }

          getFilesIncrementally("/" + finalPath);
          break;
        }
        case "unlink":
        case "add": {
          const path: string = payload.data;
          const dirs = path.split("/");

          const startIndex = dirs.findIndex((item) => item.includes("user"));
          let finalPath = "";
          // If 'user' is found, concatenate from that index onwards
          if (startIndex !== -1) {
            finalPath = dirs.slice(startIndex, dirs.length - 1).join("/");
          }

          getFilesIncrementally("/" + finalPath);
          break;
        }
        default:
          break;
      }
    };
  }, [socket, selectedFileValue, selectedFilePath, getFilesIncrementally]);

  useEffect(() => {
    if (code === null) return;
    const timer = setTimeout(() => {
      const patch = createPatch(
        selectedFilePath?.split("/").pop() || "temp.txt",
        selectedFileValue,
        code
      );
      setSelectedFileValue(code);

      if (selectedFilePath === null) {
        clearTimeout(timer);
        setCode(null);
        return;
      }

      socket?.send(
        JSON.stringify({
          type: "filePatch",
          data: patch,
          filePath: selectedFilePath,
        })
      );
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [code, selectedFileValue, selectedFilePath, socket]);

  useEffect(() => {
    if (initStreaming) {
      const rtmpSocket = new WebSocket(`${import.meta.env.VITE_RTMP_URL}`);
      rtmpSocket.onopen = async () => {
        console.log("connected");
        const tempMedia = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        console.log("tempMedia", tempMedia);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log("wait complete");
        console.log("I have media");
        const mediaRecorder = new MediaRecorder(tempMedia, {
          audioBitsPerSecond: 128000,
          videoBitsPerSecond: 2500000,
          mimeType: "video/webm; codecs=vp8,opus",
        });
        mediaRecorder.ondataavailable = (e) => {
          if (rtmpSocket) {
            console.log("binaryData", e.data);
            rtmpSocket.send(e.data);
          }
        };
        mediaRecorder.start(100);
      };
    }
  }, [initStreaming]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleEditorDidMount(editor: any) {
    editorRef.current = editor;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleEditorValidation(markers: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    markers.forEach((marker: any) =>
      console.log("onValidate:", marker.message)
    );
  }

  function handleEditorChange(value: string | undefined) {
    if (!(typeof value === "string")) return;

    setCode(value);
  }

  const getFileContent = async (filePath: string) => {
    setSelectedFilePath(filePath);

    const result = await axios.get(`${import.meta.env.VITE_API_URL}`, {
      headers: {
        path: `${ip}:3000/file/content?filePath=${filePath}`,
      },
    });

    setCode(null);
    setSelectedFileValue(result.data.content);
    setSelectedFileLanguage(result.data.language);
  };

  async function handleStreaming() {
    setInitStreaming((prev) => !prev);
  }

  async function handleMyMirror() {
    if (myMirror) {
      myMirror.stop();
      setMyMirror(null);
      return;
    }
    const media = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    const video = media.getVideoTracks()[0];
    setMyMirror(video);

    if (!videoRef.current) {
      return;
    }
    console.log(video);
    videoRef.current.srcObject = new MediaStream([video]);
  }

  function onMouseDown() {
    setIsDragging(true);
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!isDragging) return;
    const video = videoDivRef.current;
    if (!video) return;
    const postitionX = video.getBoundingClientRect().x;
    const postitionY = video.getBoundingClientRect().y;
    console.log(e.movementX, e.movementY);
    video.style.left = `${postitionX + e.movementX}px`;
    video.style.top = `${postitionY + e.movementY}px`;
  }
  function onMouseUp() {
    setIsDragging(false);
  }

  return (
    <>
      <div
        className="flex flex-col h-screen overflow-y-hidden relative"
        onMouseMove={onMouseMove}>
        <div className="w-full h-fit flex justify-between items-center px-10 py-2 bg-black border-b-2 border-b-zinc-600">
          <div className="text-white font-bold text-xl">codeStream</div>
          <div className="flex gap-2">
            <Button variant="contained" onClick={handleMyMirror}>
              Camera
            </Button>
            <Button variant="contained" onClick={handleStreaming}>
              Self Stream
            </Button>
          </div>
        </div>
        <ResizablePanelGroup
          direction="horizontal"
          className="w-screen overflow-hidden">
          <ResizablePanel defaultSize={20}>
            <div className=" bg-black h-full  overflow-y-auto custom-scrollbar pb-6">
              <FileTree
                fileTree={fileTree}
                getFilesIncrementally={getFilesIncrementally}
                currentDir={""}
                isOpen={false}
                getFileContent={getFileContent}
                currentOpenDir={currentOpenDir}
                setCurrentOpenDir={setCurrentOpenDir}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={80}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={60}>
                <div
                  className="h-full"
                  onResizeCapture={() => {
                    console.log("resize");
                  }}>
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
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel
                defaultSize={40}
                onDrag={(e) => {
                  console.log(e);
                }}>
                <Terminal
                  url={`${import.meta.env.VITE_WS_URL}/?path=${ip}:8080`}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
        <div
          ref={videoDivRef}
          className={`absolute bottom-10 right-10 ${
            myMirror ? "block" : "hidden"
          }`}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}>
          <video
            ref={videoRef}
            autoPlay
            muted
            className="rounded-full border-2 border-zinc-300 w-44 h-44 object-cover object-center cursor-move"></video>
        </div>
      </div>
    </>
  );
}
