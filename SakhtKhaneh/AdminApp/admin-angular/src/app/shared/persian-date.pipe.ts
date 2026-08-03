import { Pipe, PipeTransform } from '@angular/core';
import { formatIranDateTime } from './persian-date';

@Pipe({ name: 'persianDate', standalone: true, pure: true })
export class PersianDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined, includeTime = false): string {
    return formatIranDateTime(value, includeTime);
  }
}
