import lighthouse from '@lighthouse-web3/sdk';
import { ethers } from 'ethers';
import { SONIC_IP_CONTRACT_ABI, SONIC_IP_CONTRACT_ADDRESS } from './sonicIpContract';

/**
 * Service for handling audio tokenization operations
 */
export class AudioTokenizationService {
  private apiKey: string;
  private signer: ethers.Signer | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Sets the signer to use for blockchain transactions
   */
  setSigner(signer: ethers.Signer) {
    this.signer = signer;
  }

  /**
   * Uploads audio to IPFS via Lighthouse
   * @param audioBlob The audio recording as a Blob
   * @param metadata Additional metadata about the recording
   * @param progressCallback Callback for upload progress updates
   */
  async uploadAudio(
    audioBlob: Blob, 
    metadata: Record<string, any>, 
    progressCallback?: (progress: number) => void
  ): Promise<{ audioCid: string, metadataCid: string }> {
    if (!this.apiKey) {
      throw new Error("Lighthouse API key not configured");
    }
    
    try {
      // Create a File object from Blob
      const audioFile = new File([audioBlob], `sonic-ip-${Date.now()}.wav`, {
        type: 'audio/wav',
        lastModified: Date.now()
      });

      // Create metadata file
      const metadataFile = new File(
        [JSON.stringify(metadata, null, 2)], 
        'metadata.json', 
        { type: 'application/json' }
      );
      
      // Upload audio file
      const audioOutput = await lighthouse.upload(
        [audioFile],
        this.apiKey,
        undefined,
        (progressData: any) => {
          if (progressCallback) {
            try {
              const pct = 100 - Number(((progressData?.total / progressData?.uploaded) as number).toFixed(2));
              if (!Number.isNaN(pct)) progressCallback(pct);
            } catch {}
          }
        }
      );
      
      const audioCid = audioOutput?.data?.Hash as string;
      if (!audioCid) throw new Error("Audio upload failed: no CID returned");
      
      // Enhance metadata with audio CID
      metadata.audioCid = audioCid;
      metadata.audioUrl = `https://gateway.lighthouse.storage/ipfs/${audioCid}`;
      
      // Update metadata file with audio CID
      const updatedMetadataFile = new File(
        [JSON.stringify(metadata, null, 2)], 
        'metadata.json', 
        { type: 'application/json' }
      );
      
      // Upload metadata file
      const metadataOutput = await lighthouse.upload(
        [updatedMetadataFile],
        this.apiKey
      );
      
      const metadataCid = metadataOutput?.data?.Hash as string;
      if (!metadataCid) throw new Error("Metadata upload failed: no CID returned");
      
      return { audioCid, metadataCid };
    } catch (error) {
      console.error("Error in uploadAudio:", error);
      throw error;
    }
  }

  /**
   * Creates an NFT token for the audio
   * @param audioCid IPFS CID for the audio file
   * @param metadataCid IPFS CID for the metadata
   * @returns The token ID of the minted NFT
   */
  async mintToken(audioCid: string, metadataCid: string): Promise<string> {
    if (!this.signer) {
      throw new Error("Signer not configured. Please connect wallet first.");
    }
    
    try {
      const contract = new ethers.Contract(
        SONIC_IP_CONTRACT_ADDRESS,
        SONIC_IP_CONTRACT_ABI,
        this.signer
      );
      
      const address = await this.signer.getAddress();
      const metadataUri = `ipfs://${metadataCid}`;
      
      const tx = await contract.mintAudioToken(address, metadataUri, audioCid);
      const receipt = await tx.wait();
      
      // Find the AudioTokenized event to get the token ID
      const event = receipt.events?.find((e: any) => e.event === 'AudioTokenized');
      const tokenId = event?.args?.tokenId.toString();
      
      if (!tokenId) {
        throw new Error("Token minting failed: no token ID in event");
      }
      
      return tokenId;
    } catch (error) {
      console.error("Error in mintToken:", error);
      throw error;
    }
  }

  /**
   * Verifies if an address owns a token for a specific audio
   * @param address The address to check
   * @param audioCid The IPFS CID of the audio file
   */
  async verifyOwnership(address: string, audioCid: string): Promise<boolean> {
    if (!this.signer) {
      throw new Error("Signer not configured. Please connect wallet first.");
    }
    
    try {
      const contract = new ethers.Contract(
        SONIC_IP_CONTRACT_ADDRESS,
        SONIC_IP_CONTRACT_ABI,
        this.signer
      );
      
      return await contract.verifyOwnership(address, audioCid);
    } catch (error) {
      console.error("Error in verifyOwnership:", error);
      throw error;
    }
  }
  
  /**
   * Creates a simple audio fingerprint (for demonstration purposes)
   * In a real application, use a proper audio fingerprinting algorithm
   */
  async createAudioFingerprint(audioBlob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // This is a simplified demonstration fingerprint
        // In a real application, use a proper fingerprinting library
        const reader = new FileReader();
        reader.onload = function() {
          const arrayBuffer = reader.result as ArrayBuffer;
          const dataView = new DataView(arrayBuffer);
          
          // Sample every 1000th byte to create a simple fingerprint
          let fingerprint = '';
          for (let i = 0; i < arrayBuffer.byteLength; i += 1000) {
            if (i < arrayBuffer.byteLength) {
              fingerprint += dataView.getUint8(i).toString(16).padStart(2, '0');
            }
          }
          
          resolve(fingerprint);
        };
        
        reader.onerror = function() {
          reject(new Error("Failed to read audio file"));
        };
        
        reader.readAsArrayBuffer(audioBlob);
      } catch (error) {
        reject(error);
      }
    });
  }
}

// Export a singleton instance
export const audioTokenizationService = new AudioTokenizationService(
  process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY || ""
);