import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shortenAddress',
  standalone: true
})
export class ShortenAddressPipe implements PipeTransform {
  transform(value: string | null | undefined, length: number = 4): string {
    if (!value) return 'Not Connected';
    
    // Ethereum address regex
    if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
      return value;
    }

    return `${value.substring(0, length + 2)}...${value.substring(value.length - length)}`;
  }
}