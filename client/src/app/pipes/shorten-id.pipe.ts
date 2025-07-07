import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shortenId',
  standalone: true
})
export class ShortenIdPipe implements PipeTransform {
  transform(value: string | null | undefined, length: number = 8): string {
    if (!value) return '';
    return `${value.substring(0, length)}...${value.substring(value.length - length)}`;
  }
}