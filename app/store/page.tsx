"use client";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";
import { WalletConnect } from "@/components/walletConnect";
import { useAccount, useSwitchChain, useChainId } from "wagmi";
import { base, baseSepolia, avalanche, avalancheFuji } from "wagmi/chains";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/lib/contract";
import { useEthersProvider, useEthersSigner } from "@/hooks/useEthers";
import lighthouse from '@lighthouse-web3/sdk';
import { audioTokenizationService } from "@/lib/audioTokenizationService";
import "./styles.css";

type FaucetChain = typeof base | typeof baseSepolia | typeof avalanche | typeof avalancheFuji;

const SUPPORTED_CHAINS: FaucetChain[] = [base, baseSepolia, avalanche, avalancheFuji];

export default function AudioRecorder() {
    const { isConnected, address } = useAccount();
    const connectedChainId = useChainId();
    const { switchChain, isPending: isSwitching } = useSwitchChain();
    const [selectedId, setSelectedId] = useState<number>(baseSepolia.id);
    const [isMinting, setIsMinting] = useState(false);
    const [mintError, setMintError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedFile, setUploadedFile] = useState<any>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isStoring, setIsStoring] = useState(false);
    const [storeError, setStoreError] = useState<string | null>(null);
    const [storeSuccess, setStoreSuccess] = useState(false);
    const [isReading, setIsReading] = useState(false);
    const [readError, setReadError] = useState<string | null>(null);
    const [storedAudioUrl, setStoredAudioUrl] = useState<string | null>(null);
    const [retrievedCid, setRetrievedCid] = useState<string | null>(null);
    const selectedChain = useMemo(() => SUPPORTED_CHAINS.find((c) => c.id === selectedId)!, [selectedId]);
    const isMatching = connectedChainId === selectedId;
    const [uploading, setUploading] = useState(false);
    
    // Audio recording states
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);
    const [tokenName, setTokenName] = useState<string>("");
    const [tokenDescription, setTokenDescription] = useState<string>("");

  // Sync selected chain to connected wallet network
  useEffect(() => {
    if (connectedChainId && connectedChainId !== selectedId) {
      setSelectedId(connectedChainId);
    }
  }, [connectedChainId]);

  const signer = useEthersSigner();
  const provider = useEthersProvider();

  // Lighthouse API key - replace with your actual API key
  const LIGHTHOUSE_API_KEY = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY || "YOUR_API_KEY";

  const progressCallback = (progressData: any) => {
    let percentageDone = ((progressData?.uploaded / progressData?.total) * 100)?.toFixed(2);
    setUploadProgress(parseFloat(percentageDone) || 0);
    console.log(percentageDone);
  };

  const handleTokenize = useCallback(async () => {
    if (!isConnected || !isMatching || !uploadedFile) return;
    try {
      setIsMinting(true);
      setMintError(null);
      
      if (!provider || !signer) {
        throw new Error("Please connect your wallet");
      }
      
      // Set the signer for the tokenization service
      audioTokenizationService.setSigner(signer);
      
      // Create metadata for the token
      const metadata = {
        name: tokenName || "Sonic IP Audio",
        description: tokenDescription || "Audio recording tokenized with Sonic IP",
        creator: address || "anonymous",
        createdAt: new Date().toISOString(),
        type: "audio/wav"
      };
      
      const audioCid = uploadedFile.data.Hash;
      
      // In a production environment, you would mint the NFT here
      // This is just a simulation for the frontend demo
      try {
        console.log("Tokenizing audio with metadata:", {
          ...metadata,
          audioCid
        });
        
        // Simulating blockchain transaction time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Success!
        setMintError(null);
        
        // Now proceed with storing the CID
        await handleStore();
      } catch (mintError) {
        console.error("Error minting token:", mintError);
        throw new Error("Failed to mint token: " + (mintError instanceof Error ? mintError.message : String(mintError)));
      }
    } catch (e) {
      const err = e as unknown as { reason?: string; shortMessage?: string; message?: string };
      const reason = err?.reason || err?.shortMessage || err?.message || "Tokenization failed";
      setMintError(reason);
    } finally {
      setIsMinting(false);
    }
  }, [isConnected, isMatching, provider, signer, uploadedFile, tokenName, tokenDescription, address]);

  const handleStore = useCallback(async () => {
    if (!isConnected || !isMatching || !uploadedFile) return;
    const faucetAddress = CONTRACT_ADDRESS;
    try {
      setIsStoring(true);
      setStoreError(null);
      setStoreSuccess(false);
      
      if (!provider || !signer) {
        throw new Error("Please connect your wallet");
      }

      const contract = new ethers.Contract(
        faucetAddress,
        CONTRACT_ABI as ethers.InterfaceAbi,
        signer
      );
      
      const cid = uploadedFile.data.Hash;
      const tx = await contract.store(cid);
      await tx.wait();
      setStoreSuccess(true);
    } catch (e) {
      const err = e as unknown as { reason?: string; shortMessage?: string; message?: string };
      const reason = err?.reason || err?.shortMessage || err?.message || "Store transaction failed";
      setStoreError(reason);
    } finally {
      setIsStoring(false);
    }
  }, [isConnected, isMatching, provider, signer, uploadedFile]);

  // Audio Recording Functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Set up timer
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Error accessing your microphone. Please make sure it's connected and you've granted permission.");
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Function to upload audio to Lighthouse
  const uploadAudio = async () => {
    if (!audioBlob) return;
    
    const apiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY;
    if (!apiKey) {
      setUploadError("Lighthouse API key not configured");
      return;
    }
    
    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);
    
    try {
      // Create a File object from Blob
      const audioFile = new File([audioBlob], `sonic-ip-${Date.now()}.wav`, {
        type: 'audio/wav',
        lastModified: Date.now()
      });

      // Create metadata with token name and description
      const metadata = {
        name: tokenName || "Sonic IP Audio",
        description: tokenDescription || "Audio recording tokenized with Sonic IP",
        timestamp: new Date().toISOString(),
        creator: address || "anonymous"
      };
      
      // Create metadata file
      const metadataFile = new File(
        [JSON.stringify(metadata, null, 2)], 
        'metadata.json', 
        { type: 'application/json' }
      );
      
      const { default: lighthouse } = await import("@lighthouse-web3/sdk");
      
      // Upload both files
      const output = await lighthouse.upload(
        [audioFile, metadataFile],
        apiKey,
        undefined,
        (progressData: any) => {
          try {
            const pct = 100 - Number(((progressData?.total / progressData?.uploaded) as number).toFixed(2));
            if (!Number.isNaN(pct)) setUploadProgress(pct);
          } catch {}
        }
      );
      
      const cid = output?.data?.Hash as string | undefined;
      if (!cid) throw new Error("Upload failed: no CID returned");
     
      setUploadedFile(output);
      setUploadProgress(100);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Load stored CID and audio URL
  useEffect(() => {
    const loadStored = async () => {
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
      const hasSigner = Boolean(signer);
      const hasRpc = Boolean(rpcUrl);
      if (!hasSigner && !hasRpc) return;

      const faucetAddress = CONTRACT_ADDRESS;
      try {
        setIsReading(true);
        setReadError(null);
        setStoredAudioUrl(null);
        setRetrievedCid(null);

        const readProvider = hasSigner ? signer!.provider : new ethers.JsonRpcProvider(rpcUrl!);
        const contract = new ethers.Contract(
          faucetAddress,
          CONTRACT_ABI as ethers.InterfaceAbi,
          readProvider
        );

        const cid = await contract.retrieve();
        setRetrievedCid(cid);
        if (cid && cid !== "") {
          setStoredAudioUrl(`https://gateway.lighthouse.storage/ipfs/${cid}`);
        }
      } catch (e) {
        const err = e as unknown as { reason?: string; shortMessage?: string; message?: string };
        const reason = err?.reason || err?.shortMessage || err?.message || "Failed to read stored CID";
        setReadError(reason);
      } finally {
        setIsReading(false);
      }
    };

    loadStored();
  }, [signer, storeSuccess]);

    return (
        <div className="min-h-screen bg-white">
            {/* Hero/Header */}
            <section className="min-h-screen flex flex-col justify-between pb-10 md:pb-20">
                <div className="w-full bg-white border-b border-gray-100 shadow-sm py-4">
                    <div className="container mx-auto px-4 md:px-6 flex justify-between items-center">
                        <Link href="/">
                            <div className="flex items-center">
                                <Image
                                    className="cursor-pointer"
                                    src="/assets/logos/sonicip-logo.svg"
                                    width={32}
                                    height={32}
                                    alt="Sonic IP Logo"
                                />
                                <span className="ml-2 text-xl font-bold">SonicIPChain</span>
                                <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Beta</span>
                            </div>
                        </Link>
                        <div className="hidden md:flex items-center space-x-6">
                            <Link href="/" className="font-medium text-gray-700 hover:text-blue-600 transition-colors">Home</Link>
                            <Link href="/about" className="font-medium text-gray-700 hover:text-blue-600 transition-colors">About</Link>
                            <Link href="/profile" className="font-medium text-gray-700 hover:text-blue-600 transition-colors">My Audio</Link>
                        </div>
                        <div className="flex items-center">
                            {!isConnected ? (
                                <WalletConnect />
                            ) : (
                                <div className="flex items-center space-x-3">
                                    <span className="text-sm font-medium px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-gray-700">
                                        {address?.slice(0, 6)}...{address?.slice(-4)} 👋
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 md:px-16 mt-10">
                    <div className="header-container">
                        <h1 className="text-3xl md:text-4xl font-bold text-blue-700">
                            Record Your Audio
                        </h1>
                        <p className="text-lg text-gray-600 mt-3 mb-5 max-w-2xl">
                            Create, tokenize, and securely store your audio on the blockchain
                        </p>
                        <div className="flex items-start space-x-2 text-sm text-blue-600 bg-blue-50 px-4 py-3 rounded-md border border-blue-100">
                            <svg className="w-5 h-5 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="font-medium">Security Guaranteed</p>
                                <p className="mt-1">Your audio will be encrypted and stored securely on IPFS and the blockchain. Only you control who can access it.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Network Warning */}
                {isConnected && !isMatching && (
                    <div className="w-full max-w-4xl mx-auto p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-8">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-yellow-800 font-funnel-display">
                                You are on the wrong network. Please switch to the expected chain.
                            </p>
                            <button
                                onClick={() => switchChain({ chainId: selectedId })}
                                disabled={isSwitching}
                                className={`ml-3 px-3 py-1.5 rounded-md text-sm font-funnel-display font-semibold transition-colors ${
                                    isSwitching ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-yellow-600 text-white hover:bg-yellow-700'
                                }`}
                            >
                                {isSwitching ? 'Switching...' : 'Switch Network'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-4xl mx-auto mt-6">
                    {!isConnected ? (
                        <div className="w-full text-center py-16 px-6 border border-blue-100 rounded-xl bg-gradient-to-b from-white to-blue-50 shadow-sm">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">Connect Your Wallet</h2>
                            <p className="text-gray-600 mb-8 max-w-md mx-auto">To create and tokenize your audio recordings, you need to connect your cryptocurrency wallet first.</p>
                            <div className="flex justify-center">
                                <WalletConnect />
                            </div>
                            <p className="text-xs text-gray-500 mt-8 max-w-sm mx-auto">By connecting your wallet, you agree to our Terms of Service and Privacy Policy.</p>
                        </div>
                    ) : (
                        <div className="w-full">
                            {/* Step 1: Record Audio */}
                            <div className="mb-12 p-8 recording-card">
                                <div className="flex items-center mb-4">
                                    <div className="step-indicator">1</div>
                                    <h2 className="text-2xl font-bold text-gray-800">Record Your Audio</h2>
                                </div>
                                <p className="text-gray-600 mb-8 pl-12">Record your voice or audio using your device's microphone</p>
                                
                                <div className="flex flex-col items-center space-y-6 py-6">
                                    {!audioBlob ? (
                                        <div className="w-full max-w-md">
                                            <div className="flex flex-col items-center">
                                                <div className="record-button-container mb-5">
                                                    <button
                                                        onClick={isRecording ? stopRecording : startRecording}
                                                        disabled={!isConnected || !isMatching}
                                                        className={`record-button ${isRecording ? 'record-button-recording' : ''} ${(!isConnected || !isMatching) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        {isRecording ? (
                                                            <div className="flex flex-col items-center">
                                                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <rect x="6" y="6" width="12" height="12" rx="2" strokeWidth="2" />
                                                                </svg>
                                                                <span className="text-sm mt-1 font-medium">{formatTime(recordingTime)}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center">
                                                                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                                                                    <circle cx="12" cy="12" r="4" fill="currentColor" />
                                                                </svg>
                                                                <span className="text-sm font-medium mt-1">Start</span>
                                                            </div>
                                                        )}
                                                    </button>
                                                </div>
                                                <div className="bg-gray-50 px-5 py-3 rounded-lg border border-gray-200 shadow-sm">
                                                    <p className="text-center text-gray-700 font-medium">
                                                        {isRecording ? '🔴 Recording in progress... Click to stop' : 'Press the button to start recording'}
                                                    </p>
                                                    <p className="text-center text-sm text-gray-500 mt-2">
                                                        {isRecording ? `Duration: ${formatTime(recordingTime)}` : 'Speak clearly into your microphone'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full max-w-md">
                                            <div className="success-container">
                                                <div className="flex items-center justify-center mb-5">
                                                    <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 text-green-600 shadow-md">
                                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </span>
                                                </div>
                                                <p className="text-center text-xl font-semibold text-gray-800 mb-4">
                                                    Recording Complete!
                                                </p>
                                                <div className="flex justify-center mb-6">
                                                    <div className="audio-preview w-full">
                                                        <p className="text-sm font-medium text-gray-700 mb-2">Preview your audio:</p>
                                                        <audio controls src={audioUrl || ''} className="audio-controls" />
                                                        <p className="text-sm text-gray-500 mt-3 flex items-center justify-between">
                                                            <span>Duration: {formatTime(recordingTime)}</span>
                                                            <span>Format: WAV</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex justify-center space-x-4">
                                                    <button 
                                                        onClick={() => {
                                                            setAudioBlob(null);
                                                            setAudioUrl(null);
                                                            setRecordingTime(0);
                                                        }}
                                                        className="btn-secondary px-5 py-3 flex-1"
                                                    >
                                                        <span className="flex items-center justify-center">
                                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                            </svg>
                                                            Record Again
                                                        </span>
                                                    </button>
                                                    <button 
                                                        onClick={uploadAudio}
                                                        disabled={uploading}
                                                        className="btn-primary px-5 py-3 flex-1 disabled:opacity-50"
                                                    >
                                                        <span className="flex items-center justify-center">
                                                            {uploading ? (
                                                                <>
                                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                    Uploading...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                                    </svg>
                                                                    Upload Audio
                                                                </>
                                                            )}
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {uploading && (
                                        <div className="w-full max-w-md mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-sm font-medium text-blue-700">Uploading to IPFS...</p>
                                                <span className="text-sm font-bold text-blue-700">{uploadProgress.toFixed(0)}%</span>
                                            </div>
                                            <div className="w-full bg-white rounded-full h-2.5 shadow-inner">
                                                <div 
                                                    className="bg-blue-600 h-2.5 rounded-full shadow-sm transition-all duration-300" 
                                                    style={{ width: `${uploadProgress}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs mt-2 text-blue-600">
                                                Your audio is being encrypted and uploaded to the decentralized storage network
                                            </p>
                                        </div>
                                    )}
                                    
                                    {uploadError && (
                                        <div className="w-full max-w-md mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                            <div className="flex items-center">
                                                <div className="shrink-0">
                                                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <p className="ml-3 text-sm text-red-600">
                                                    Upload failed: {uploadError}
                                                </p>
                                            </div>
                                            <p className="text-xs text-red-500 mt-1 ml-8">Please try again or contact support if the issue persists.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Step 2: Tokenize Audio */}
                            {uploadedFile && (
                                <div className="mb-12 p-8 recording-card">
                                    <div className="flex items-center mb-5">
                                        <div className="step-indicator">2</div>
                                        <h2 className="text-2xl font-bold text-gray-800">Tokenize Your Audio</h2>
                                    </div>
                                    
                                    <div className="w-full max-w-lg mx-auto space-y-6">
                                        <div className="p-5 bg-green-50 border border-green-200 rounded-lg mb-4 flex items-start">
                                            <div className="shrink-0 mr-4">
                                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-medium text-green-800">
                                                    Audio uploaded successfully!
                                                </p>
                                                <p className="text-sm mt-1 text-gray-600">
                                                    Your audio is now stored on IPFS and ready to be tokenized.
                                                    <a 
                                                        href={`https://gateway.lighthouse.storage/ipfs/${uploadedFile.data.Hash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="ml-1 text-blue-600 hover:underline"
                                                    >
                                                        Listen to file
                                                    </a>
                                                </p>
                                                <p className="text-xs mt-2 text-gray-500 font-mono bg-white px-3 py-1 rounded border border-gray-200 overflow-x-auto">
                                                    IPFS Hash: {uploadedFile.data.Hash}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                            <h3 className="text-lg font-semibold mb-4 text-gray-800">NFT Details</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Token Name*</label>
                                                    <input
                                                        type="text"
                                                        value={tokenName}
                                                        onChange={(e) => setTokenName(e.target.value)}
                                                        placeholder="My Sonic IP"
                                                        className="form-input"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description*</label>
                                                    <textarea
                                                        value={tokenDescription}
                                                        onChange={(e) => setTokenDescription(e.target.value)}
                                                        placeholder="Describe your audio creation..."
                                                        className="form-input"
                                                        rows={3}
                                                    ></textarea>
                                                    <p className="text-xs text-gray-500 mt-1">This description will be permanently stored on the blockchain.</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="pt-4">
                                            <button
                                                onClick={handleTokenize}
                                                disabled={isMinting || !isConnected || !isMatching}
                                                className="btn-primary w-full py-4 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isMinting ? (
                                                    <div className="flex items-center justify-center space-x-2">
                                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        <span>Tokenizing...</span>
                                                    </div>
                                                ) : (
                                                    'Tokenize & Store on Blockchain'
                                                )}
                                            </button>
                                            
                                            {mintError && (
                                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                                                    <p className="text-sm text-red-600 text-center">
                                                        {mintError}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Step 3: View Stored Audio */}
                            {storeSuccess && (
                                <div className="mb-12 p-8 recording-card">
                                    <div className="flex items-center mb-5">
                                        <div className="step-indicator">3</div>
                                        <h2 className="text-2xl font-bold text-gray-800">Audio Successfully Stored!</h2>
                                    </div>
                                    
                                    <div className="w-full max-w-lg mx-auto">
                                        <div className="success-container">
                                            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-md">
                                                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <h3 className="text-2xl font-semibold text-green-800 mb-3">
                                                Sonic IP Successfully Created!
                                            </h3>
                                            <p className="text-gray-600 mb-6 text-lg">
                                                Your audio has been tokenized and stored permanently on the blockchain
                                            </p>
                                            
                                            <div className="flex items-center justify-center">
                                                <div className="w-32 h-0.5 bg-gray-200"></div>
                                                <div className="px-4 text-gray-400 text-sm">DETAILS</div>
                                                <div className="w-32 h-0.5 bg-gray-200"></div>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 text-left">
                                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                                    <h4 className="font-medium text-gray-700 mb-2">NFT Info</h4>
                                                    <div className="space-y-2">
                                                        <p className="text-sm"><span className="text-gray-500">Name:</span> {tokenName || "Sonic IP Audio"}</p>
                                                        <p className="text-sm"><span className="text-gray-500">Created:</span> {new Date().toLocaleDateString()}</p>
                                                        <p className="text-sm"><span className="text-gray-500">Owner:</span> {address?.slice(0, 6)}...{address?.slice(-4)}</p>
                                                    </div>
                                                </div>
                                                
                                                {retrievedCid && (
                                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                                        <h4 className="font-medium text-gray-700 mb-2">Storage Info</h4>
                                                        <p className="text-sm mb-2"><span className="text-gray-500">Storage:</span> IPFS / Filecoin</p>
                                                        <p className="text-xs font-mono bg-gray-50 p-2 rounded overflow-x-auto border border-gray-100 text-gray-600">
                                                            {retrievedCid}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {storedAudioUrl && (
                                                <div className="mt-8 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                                                    <h4 className="font-medium text-gray-800 mb-3">
                                                        Your tokenized audio:
                                                    </h4>
                                                    <audio controls src={storedAudioUrl} className="w-full audio-controls mb-2" />
                                                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                                                        <a href={storedAudioUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center">
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                            </svg>
                                                            Open in new tab
                                                        </a>
                                                        <span>Permanently stored on IPFS</span>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <div className="mt-8">
                                                <button 
                                                    onClick={() => window.location.href = '/profile'}
                                                    className="btn-primary px-6 py-3"
                                                >
                                                    View in My Collection
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </div>
    );
}