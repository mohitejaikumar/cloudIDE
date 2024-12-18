import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router";
import Button from "./Button";
import { BackgroundGradient } from "./ui/background-gradient";
import DemoImg from "../assets/images/demo.png";
import Navbar from "./Navbar";
import useClient from "../hook/useClient";

export default function LandingPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Creating IDE Instance");
  const { clientId } = useClient();

  const navigate = useNavigate();

  async function handleCreateIDE() {
    // logic to create IDE
    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_BROKER_URL}/spin-ide`
      );
      setStatus("Initializing IDE ...");
      await new Promise((resolve) => setTimeout(resolve, 10000));
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_BROKER_URL}/get-ip`,
          {
            taskArn: response.data.taskArn,
          }
        );

        const ip = res.data.replace(/-/g, ".");
        const timer = setInterval(async () => {
          try {
            await axios.get(`${import.meta.env.VITE_API_URL}`, {
              headers: {
                path: `${ip}:3000`,
                "client-id": clientId,
              },
            });
            clearInterval(timer);
            navigate(`/ide/${res.data}`);
            setLoading(false);
          } catch (error) {
            console.log(error);
          }
        }, 2000);
      } catch (error) {
        console.log(error);
        setStatus("Failed to get IP");
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
      setStatus("Failed to create IDE");
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen w-screen flex flex-col items-center bg-gradientRadial bg-double animate-gradientAnimation py-1 overflow-x-hidden">
        <div className="flex items-center justify-center px-6 mt-40">
          <div className="text-center max-w-3xl">
            <h1 className="text-3xl lg:text-5xl font-bold text-white">
              Collaborate in Code and Share with World
            </h1>
            <p className="mt-4 text-sm lg:text-lg text-slate-300">
              Collaborate, manage, code and stream with our intuitive platform
              designed <br />
              for <span className="text-white">developers</span> and{" "}
              <span className="text-white">youtubers</span>.
            </p>
            <div className="mt-8 flex justify-center space-x-4">
              <Button
                variant="primary"
                onClick={() => {
                  console.log("signup redirect");
                }}>
                Get Started
              </Button>
              <Button
                variant="outlined"
                onClick={handleCreateIDE}
                disabled={loading}>
                {loading ? status : "Create IDE +"}
              </Button>
            </div>
          </div>
        </div>
        <div className="w-full md:w-[75%] mt-10 sm:mt-20 overflow-x-hidden rounded-[22px] mb-3">
          <BackgroundGradient className="rounded-[22px] p-2 md:p-4 lg:p-8 bg-white dark:bg-zinc-900">
            <img src={DemoImg} alt="demo" className="object-contain" />
          </BackgroundGradient>
        </div>
      </div>
    </>
  );
}
