import { Injectable } from '@angular/core';
import { create } from 'ipfs-http-client';

@Injectable({
  providedIn: 'root'
})
export class IpfsService {
  private ipfs: any;

  constructor() {
    this.ipfs = create({ url: 'https://ipfs.infura.io:5001/api/v0' });
  }

  async uploadFile(file: File): Promise<string> {
    const fileBuffer = await file.arrayBuffer();
    const result = await this.ipfs.add(fileBuffer);
    return result.path;
  }

  async getFile(cid: string): Promise<any> {
    const chunks = [];
    for await (const chunk of this.ipfs.cat(cid)) {
      chunks.push(chunk);
    }
    return new Blob(chunks);
  }
}