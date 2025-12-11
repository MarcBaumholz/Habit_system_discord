import * as fs from 'fs/promises';
import * as path from 'path';
import { ProfileGenerator } from './profile-generator';

export interface ProfileMetadata {
  discordId: string;
  lastGenerated: string;
  hash: string;
  filePath: string;
}

export class ProfileStorage {
  private profilesDir: string;
  private metadataFile: string;
  private generator: ProfileGenerator;

  constructor(generator: ProfileGenerator, baseDir: string = process.cwd()) {
    this.profilesDir = path.join(baseDir, 'data', 'profiles');
    this.metadataFile = path.join(baseDir, 'data', 'profile-metadata.json');
    this.generator = generator;
  }

  /**
   * Ensure profiles directory exists
   */
  async ensureDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.profilesDir, { recursive: true });
      console.log(`✅ Profiles directory ready: ${this.profilesDir}`);
    } catch (error) {
      console.error('❌ Error creating profiles directory:', error);
      throw error;
    }
  }

  /**
   * Get profile file path for a Discord ID
   */
  getProfilePath(discordId: string): string {
    return path.join(this.profilesDir, `${discordId}.md`);
  }

  /**
   * Load profile metadata
   */
  async loadMetadata(): Promise<Map<string, ProfileMetadata>> {
    try {
      const data = await fs.readFile(this.metadataFile, 'utf-8');
      const metadata = JSON.parse(data) as Record<string, ProfileMetadata>;
      return new Map(Object.entries(metadata));
    } catch (error) {
      // File doesn't exist yet, return empty map
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return new Map();
      }
      console.error('❌ Error loading metadata:', error);
      return new Map();
    }
  }

  /**
   * Save profile metadata
   */
  async saveMetadata(metadata: Map<string, ProfileMetadata>): Promise<void> {
    try {
      const dataDir = path.dirname(this.metadataFile);
      await fs.mkdir(dataDir, { recursive: true });
      
      const obj = Object.fromEntries(metadata);
      await fs.writeFile(this.metadataFile, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (error) {
      console.error('❌ Error saving metadata:', error);
      throw error;
    }
  }

  /**
   * Check if profile exists and is fresh
   */
  async profileExists(discordId: string): Promise<boolean> {
    try {
      const profilePath = this.getProfilePath(discordId);
      await fs.access(profilePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if profile needs regeneration (older than 24 hours or missing)
   * Also checks if data has changed by comparing hash
   */
  async needsRegeneration(discordId: string, forceCheck: boolean = false): Promise<boolean> {
    const exists = await this.profileExists(discordId);
    if (!exists) {
      console.log(`📝 Profile missing for ${discordId}, needs generation`);
      return true;
    }

    const metadata = await this.loadMetadata();
    const profileMeta = metadata.get(discordId);
    
    if (!profileMeta) {
      console.log(`📝 No metadata for ${discordId}, needs generation`);
      return true;
    }

    // If force check, regenerate to ensure data is fresh
    if (forceCheck) {
      try {
        // Generate new profile and compare hash
        const newProfileContent = await this.generator.generateProfile(discordId);
        const newHash = this.generator.calculateProfileHash(newProfileContent);
        
        if (newHash !== profileMeta.hash) {
          console.log(`📝 Profile data changed for ${discordId}, needs regeneration`);
          return true;
        }
      } catch (error) {
        console.error(`⚠️ Error checking profile hash for ${discordId}:`, error);
        // If check fails, regenerate to be safe
        return true;
      }
    }

    const lastGenerated = new Date(profileMeta.lastGenerated);
    const now = new Date();
    const hoursSinceGeneration = (now.getTime() - lastGenerated.getTime()) / (1000 * 60 * 60);

    // Regenerate if older than 24 hours (safety check)
    if (hoursSinceGeneration > 24) {
      console.log(`📝 Profile older than 24h for ${discordId}, needs regeneration`);
      return true;
    }

    return false;
  }

  /**
   * Get profile content from file
   */
  async getProfile(discordId: string): Promise<string | null> {
    try {
      const profilePath = this.getProfilePath(discordId);
      const content = await fs.readFile(profilePath, 'utf-8');
      return content;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      console.error('❌ Error reading profile:', error);
      return null;
    }
  }

  /**
   * Save profile to file and update metadata
   */
  async saveProfile(discordId: string, profileContent: string): Promise<void> {
    try {
      await this.ensureDirectory();
      
      const profilePath = this.getProfilePath(discordId);
      await fs.writeFile(profilePath, profileContent, 'utf-8');

      // Update metadata
      const hash = this.generator.calculateProfileHash(profileContent);
      const metadata = await this.loadMetadata();
      metadata.set(discordId, {
        discordId,
        lastGenerated: new Date().toISOString(),
        hash,
        filePath: profilePath,
      });
      await this.saveMetadata(metadata);

      console.log(`✅ Profile saved for ${discordId} at ${profilePath}`);
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      throw error;
    }
  }

  /**
   * Generate and save profile
   */
  async generateAndSave(discordId: string): Promise<string> {
    try {
      console.log(`🔄 Generating profile for ${discordId}...`);
      const profileContent = await this.generator.generateProfile(discordId);
      await this.saveProfile(discordId, profileContent);
      return profileContent;
    } catch (error) {
      console.error('❌ Error generating and saving profile:', error);
      throw error;
    }
  }

  /**
   * Get profile, generating if needed
   */
  async getOrGenerateProfile(discordId: string, forceRegenerate: boolean = false): Promise<string> {
    if (forceRegenerate || await this.needsRegeneration(discordId)) {
      return await this.generateAndSave(discordId);
    }

    const existing = await this.getProfile(discordId);
    if (existing) {
      return existing;
    }

    // Generate if doesn't exist
    return await this.generateAndSave(discordId);
  }

  /**
   * Delete profile file
   */
  async deleteProfile(discordId: string): Promise<void> {
    try {
      const profilePath = this.getProfilePath(discordId);
      await fs.unlink(profilePath);

      // Remove from metadata
      const metadata = await this.loadMetadata();
      metadata.delete(discordId);
      await this.saveMetadata(metadata);

      console.log(`✅ Profile deleted for ${discordId}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('❌ Error deleting profile:', error);
        throw error;
      }
    }
  }

  /**
   * Get profile metadata
   */
  async getProfileMetadata(discordId: string): Promise<ProfileMetadata | null> {
    const metadata = await this.loadMetadata();
    return metadata.get(discordId) || null;
  }
}

