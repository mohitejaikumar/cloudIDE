import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import FileTree from "./FileTree";
import Terminal from "./Terminal";
import { IFileTree } from "../types";
import Editor from "@monaco-editor/react";
import { applyPatch, createPatch } from "diff";
import { useParams } from "react-router";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./ui/resizable";
import Button from "./Button";
import useClient from "../hook/useClient";

export default function CloudIDE() {
  const editorRef = useRef(null);
  const params = useParams();
  const ip = params.id?.replace(/-/g, ".");
  const { clientId, socket, setWsURL, setHandles } = useClient();
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
  const [loading, setLoading] = useState(false);
  const [rtmpIp, setRtmpIp] = useState("");

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
          "client-id": clientId,
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
    [ip, updateFileTree, fileTree, clientId]
  );

  useEffect(() => {
    if (socket == null) return;
    console.log("socket", "register onmessage", socket);
    setHandles((prevHandle) => {
      const newHandles = { ...prevHandle };
      newHandles["filePatch"] = (payload) => {
        console.log("filePatch", payload);
        if (payload.filePath !== selectedFilePath) return;
        const originalValue = selectedFileValue;
        const patch = applyPatch(originalValue, payload.data);

        if (patch) setSelectedFileValue(patch);
      };

      newHandles["addDir"] = (payload) => {
        console.log("addDir", payload);
        const path: string = payload.data;
        const dirs = path.split("/");

        const startIndex = dirs.findIndex((item) => item.includes("user"));
        let finalPath = "";
        // If 'user' is found, concatenate from that index onwards
        if (startIndex !== -1) {
          finalPath = dirs.slice(startIndex, dirs.length - 1).join("/");
        }

        getFilesIncrementally("/" + finalPath);
      };

      newHandles["add"] = (payload) => {
        console.log("add", payload);
        const path: string = payload.data;
        const dirs = path.split("/");

        const startIndex = dirs.findIndex((item) => item.includes("user"));
        let finalPath = "";
        // If 'user' is found, concatenate from that index onwards
        if (startIndex !== -1) {
          finalPath = dirs.slice(startIndex, dirs.length - 1).join("/");
        }

        getFilesIncrementally("/" + finalPath);
      };

      return newHandles;
    });
  }, [
    socket,
    selectedFileValue,
    getFilesIncrementally,
    selectedFilePath,
    setHandles,
  ]);

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
          clientId: clientId,
        })
      );
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [code, selectedFileValue, selectedFilePath, socket, clientId]);

  useEffect(() => {
    if (initStreaming) {
      const rtmpSocket = new WebSocket(
        `${import.meta.env.VITE_WS_URL}/?path=${rtmpIp}:8082`
      );
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
      const tempIp = rtmpIp.replace(/\./g, "-");
      window.open(`/stream/${tempIp}`, "_blank");
    }
  }, [initStreaming, rtmpIp]);

  useEffect(() => {
    setWsURL(
      () =>
        `${import.meta.env.VITE_WS_URL}/?path=${ip}:8080&clientId=${clientId}`
    );
  }, []);

  useEffect(() => {
    if (socket) {
      setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "ping" }));
        }
      }, 10000);
    }
  }, [socket]);

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
        "client-id": clientId,
      },
    });

    setCode(null);
    setSelectedFileValue(result.data.content);
    setSelectedFileLanguage(result.data.language);
  };

  async function handleStreaming() {
    // logic to create rtmp-server
    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_BROKER_URL}/spin-rtmp`
      );
      await new Promise((resolve) => setTimeout(resolve, 10000));
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_BROKER_URL}/get-rtmp-ip`,
          {
            taskArn: response.data.taskArn,
          }
        );

        const ip = res.data.replace(/-/g, ".");
        setRtmpIp(ip);
        localStorage.setItem("rtmpIp", ip);
        const timer = setInterval(async () => {
          try {
            await axios.get(`${import.meta.env.VITE_API_URL}`, {
              headers: {
                path: `${ip}:8081`,
              },
            });
            clearInterval(timer);
            setLoading(false);
            setInitStreaming((prev) => !prev);
          } catch (error) {
            console.log(error);
          }
        }, 2000);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
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
    const width = window.innerWidth;
    const height = window.innerHeight;
    const postitionX = video.getBoundingClientRect().x;
    const postitionY = video.getBoundingClientRect().y;
    let videoPositionX = Math.max(postitionX + e.movementX, 90);
    videoPositionX = Math.min(videoPositionX, width - 90);
    let videoPositionY = Math.max(postitionY + e.movementY, 90);
    videoPositionY = Math.min(videoPositionY, height - 90);
    console.log(e.movementX, e.movementY);
    video.style.left = `${videoPositionX}px`;
    video.style.top = `${videoPositionY}px`;
  }
  function onMouseUp() {
    setIsDragging(false);
  }

  if (socket === null) {
    return <div>Loading ...</div>;
  }

  return (
    <>
      <div
        className="flex flex-col h-screen overflow-y-hidden relative"
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}>
        <div className="w-full h-fit flex justify-between items-center px-10 py-2 bg-black border-b-2 border-b-zinc-600">
          <div className="text-white font-bold text-xl">codeStream</div>
          <div className="flex gap-2">
            <Button variant="contained" onClick={handleMyMirror}>
              Camera
            </Button>
            <Button
              variant="contained"
              onClick={handleStreaming}
              disabled={loading}>
              Stream {initStreaming && !loading ? "Stop" : "Start"}{" "}
              {loading ? "..." : ""}
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
                <Terminal />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
        <div
          ref={videoDivRef}
          className={`fixed bottom-10 right-10 ${
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
