import { ethers } from "ethers";
import { SonicVoiceNFT__factory } from "../types/factories/SonicVoiceNFT__factory";
import { SonicVoiceMarketplace__factory } from "../types/factories/SonicVoiceMarketplace__factory";
import { SonicVoiceRegistry__factory } from "../types/factories/SonicVoiceRegistry__factory";

export const SONIC_VOICE_NFT_ADDRESS = "YOUR_DEPLOYED_NFT_CONTRACT_ADDRESS";
export const SONIC_VOICE_MARKETPLACE_ADDRESS = "YOUR_DEPLOYED_MARKETPLACE_ADDRESS";
export const SONIC_VOICE_REGISTRY_ADDRESS = "YOUR_DEPLOYED_REGISTRY_ADDRESS";

export interface VoiceMetadata {
  title: string;
  description: string;
  voiceHash: string;
  duration: number;
  createdAt: number;
  tags: string[];
  language: string;
  contentType: string;
}

export interface License {
  commercial: boolean;
  derivative: boolean;
  attribution: boolean;
  validUntil: number;
  customTerms: string;
}

export interface Royalty {
  recipient: string;
  percentage: number;
}

export class SonicVoiceService {
  private signer: ethers.Signer | null = null;
  private provider: ethers.providers.Provider | null = null;
  private nftContract: any = null;
  private marketplaceContract: any = null;
  private registryContract: any = null;

  constructor() {
    // Contracts will be initialized when setSigner is called
  }

  public setSigner(signer: ethers.Signer) {
    this.signer = signer;
    this.provider = signer.provider as ethers.providers.Provider;
    this.initializeContracts();
  }

  private initializeContracts() {
    if (!this.signer) throw new Error("Signer not set");

    this.nftContract = SonicVoiceNFT__factory.connect(
      SONIC_VOICE_NFT_ADDRESS,
      this.signer
    );
    
    this.marketplaceContract = SonicVoiceMarketplace__factory.connect(
      SONIC_VOICE_MARKETPLACE_ADDRESS,
      this.signer
    );
    
    this.registryContract = SonicVoiceRegistry__factory.connect(
      SONIC_VOICE_REGISTRY_ADDRESS,
      this.signer
    );
  }

  /**
   * Mint a new voice NFT with simple metadata
   */
  public async mintSimpleVoiceNFT(
    to: string,
    metadataURI: string,
    voiceHash: string,
    title: string,
    description: string
  ): Promise<{ tokenId: number; tx: ethers.ContractTransaction }> {
    if (!this.nftContract) throw new Error("Contract not initialized");

    const tx = await this.nftContract.mintSimpleVoiceNFT(
      to,
      metadataURI,
      voiceHash,
      title,
      description
    );

    const receipt = await tx.wait();
    const event = receipt.events?.find(e => e.event === "VoiceTokenMinted");
    const tokenId = event?.args?.tokenId.toNumber();

    return { tokenId, tx };
  }

  /**
   * Mint a new voice NFT with detailed metadata
   */
  public async mintVoiceNFT(
    to: string,
    metadataURI: string,
    voiceMetadata: VoiceMetadata,
    license: License,
    royalty: Royalty
  ): Promise<{ tokenId: number; tx: ethers.ContractTransaction }> {
    if (!this.nftContract) throw new Error("Contract not initialized");

    const tx = await this.nftContract.mintVoiceNFT(
      to,
      metadataURI,
      voiceMetadata.title,
      voiceMetadata.description,
      voiceMetadata.voiceHash,
      voiceMetadata.duration,
      voiceMetadata.tags,
      voiceMetadata.language,
      voiceMetadata.contentType,
      license,
      royalty
    );

    const receipt = await tx.wait();
    const event = receipt.events?.find(e => e.event === "VoiceTokenMinted");
    const tokenId = event?.args?.tokenId.toNumber();

    return { tokenId, tx };
  }

  /**
   * Get voice metadata for a token
   */
  public async getVoiceMetadata(tokenId: number): Promise<VoiceMetadata> {
    if (!this.nftContract) throw new Error("Contract not initialized");
    return this.nftContract.getVoiceMetadata(tokenId);
  }

  /**
   * Get license information for a token
   */
  public async getLicense(tokenId: number): Promise<License> {
    if (!this.nftContract) throw new Error("Contract not initialized");
    return this.nftContract.getLicense(tokenId);
  }

  /**
   * Get royalty information for a token
   */
  public async getRoyalty(tokenId: number): Promise<Royalty> {
    if (!this.nftContract) throw new Error("Contract not initialized");
    return this.nftContract.getRoyalty(tokenId);
  }

  /**
   * Update license for a token
   */
  public async updateLicense(tokenId: number, license: License): Promise<ethers.ContractTransaction> {
    if (!this.nftContract) throw new Error("Contract not initialized");
    return this.nftContract.updateLicense(tokenId, license);
  }

  /**
   * Update royalty for a token
   */
  public async updateRoyalty(tokenId: number, royalty: Royalty): Promise<ethers.ContractTransaction> {
    if (!this.nftContract) throw new Error("Contract not initialized");
    return this.nftContract.updateRoyalty(tokenId, royalty);
  }

  /**
   * Check if a voice recording has already been tokenized
   */
  public async voiceExists(voiceHash: string): Promise<{ exists: boolean; tokenId: number }> {
    if (!this.nftContract) throw new Error("Contract not initialized");
    return this.nftContract.voiceExists(voiceHash);
  }

  /**
   * List a token for sale on the marketplace
   */
  public async listToken(
    tokenId: number, 
    price: ethers.BigNumber, 
    paymentToken: string = ethers.constants.AddressZero
  ): Promise<ethers.ContractTransaction> {
    if (!this.marketplaceContract) throw new Error("Contract not initialized");
    
    // First approve the marketplace to transfer the NFT
    await this.nftContract.approve(SONIC_VOICE_MARKETPLACE_ADDRESS, tokenId);
    
    // Then list the token
    return this.marketplaceContract.listToken(tokenId, price, paymentToken);
  }

  /**
   * Cancel a token listing
   */
  public async cancelListing(tokenId: number): Promise<ethers.ContractTransaction> {
    if (!this.marketplaceContract) throw new Error("Contract not initialized");
    return this.marketplaceContract.cancelListing(tokenId);
  }

  /**
   * Buy a token with ETH
   */
  public async buyToken(tokenId: number, price: ethers.BigNumber): Promise<ethers.ContractTransaction> {
    if (!this.marketplaceContract) throw new Error("Contract not initialized");
    return this.marketplaceContract.buyToken(tokenId, { value: price });
  }

  /**
   * Buy a token with ERC20 tokens
   */
  public async buyTokenWithERC20(tokenId: number): Promise<ethers.ContractTransaction> {
    if (!this.marketplaceContract) throw new Error("Contract not initialized");
    return this.marketplaceContract.buyTokenWithERC20(tokenId);
  }

  /**
   * Get active listings with pagination
   */
  public async getActiveListings(offset: number, limit: number): Promise<number[]> {
    if (!this.marketplaceContract) throw new Error("Contract not initialized");
    return this.marketplaceContract.getActiveListings(offset, limit);
  }

  /**
   * Register a voice signature
   */
  public async registerVoiceSignature(
    tokenId: number,
    signatureHash: string,
    metadata: string
  ): Promise<{ signatureId: number; tx: ethers.ContractTransaction }> {
    if (!this.registryContract) throw new Error("Contract not initialized");

    const tx = await this.registryContract.registerVoiceSignature(
      tokenId,
      signatureHash,
      metadata
    );

    const receipt = await tx.wait();
    const event = receipt.events?.find(e => e.event === "VoiceSignatureRegistered");
    const signatureId = event?.args?.signatureId.toNumber();

    return { signatureId, tx };
  }

  /**
   * Verify a voice signature
   */
  public async verifyVoiceSignature(
    signatureId: number,
    sampleHash: string,
    verificationData: string
  ): Promise<boolean> {
    if (!this.registryContract) throw new Error("Contract not initialized");
    return this.registryContract.verifyVoiceSignature(signatureId, sampleHash, verificationData);
  }

  /**
   * Get user's voice signatures
   */
  public async getUserSignatures(userAddress: string): Promise<number[]> {
    if (!this.registryContract) throw new Error("Contract not initialized");
    return this.registryContract.getUserSignatures(userAddress);
  }
}

// Create a singleton instance
export const sonicVoiceService = new SonicVoiceService();