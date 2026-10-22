import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

export type ComparisonDialogMode = 'replace' | 'insert';

export type ComparisonSelectionAction = {
  row: number;
  mode: ComparisonDialogMode;
};

@Component({
  selector: 'app-recipe-row-comparison-dialog',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './recipe-row-comparison-dialog.component.html',
  styleUrl: './recipe-row-comparison-dialog.component.css'
})
export class RecipeRowComparisonDialogComponent implements OnInit, AfterViewInit {
  @Input() initialRow = 1;
  @Input() editableRowCount = 0;

  @Output() selectionRequested = new EventEmitter<ComparisonSelectionAction>();
  @Output() targetRowChanged = new EventEmitter<number>();
  @Output() modeChanged = new EventEmitter<ComparisonDialogMode>();
  @Output() closed = new EventEmitter<void>();

  @ViewChild('comparisonSelectionDialog', { static: true })
  private dialogElement!: ElementRef<HTMLElement>;

  tab: ComparisonDialogMode = 'replace';
  targetRow = 1;
  dialogPosition: { left: number; top: number } | null = null;
  private dragOffset: { x: number; y: number } | null = null;

  get targetRowMax(): number {
    return this.editableRowCount + (this.tab === 'insert' ? 1 : 0);
  }

  ngOnInit(): void {
    this.targetRow = this.clampTargetRow(this.initialRow);
  }

  ngAfterViewInit(): void {
    window.setTimeout(() => {
      this.dialogElement.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }, 0);
  }

  close(event: MouseEvent): void {
    event.stopPropagation();
    this.closed.emit();
  }

  selectTab(tab: ComparisonDialogMode, event: MouseEvent): void {
    event.stopPropagation();
    this.tab = tab;
    this.targetRow = this.clampTargetRow(this.targetRow);
    this.modeChanged.emit(tab);
    this.targetRowChanged.emit(this.targetRow);
  }

  onTargetRowChange(row: number): void {
    this.targetRow = this.clampTargetRow(row);
    this.targetRowChanged.emit(this.targetRow);
  }

  confirm(event: MouseEvent): void {
    event.stopPropagation();
    this.selectionRequested.emit({ row: this.targetRow, mode: this.tab });
  }

  startDrag(event: MouseEvent): void {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const dialogRect = this.dialogElement.nativeElement.getBoundingClientRect();
    this.dialogPosition = { left: dialogRect.left, top: dialogRect.top };
    this.dragOffset = {
      x: event.clientX - dialogRect.left,
      y: event.clientY - dialogRect.top
    };
  }

  @HostListener('document:mousemove', ['$event'])
  drag(event: MouseEvent): void {
    if (!this.dragOffset) {
      return;
    }

    const dialogRect = this.dialogElement.nativeElement.getBoundingClientRect();
    const left = event.clientX - this.dragOffset.x;
    const top = event.clientY - this.dragOffset.y;
    this.dialogPosition = {
      left: Math.max(0, Math.min(left, window.innerWidth - dialogRect.width)),
      top: Math.max(0, Math.min(top, window.innerHeight - dialogRect.height))
    };
  }

  @HostListener('document:mouseup')
  stopDrag(): void {
    this.dragOffset = null;
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Node) || !this.dialogElement.nativeElement.contains(target)) {
      this.closed.emit();
    }
  }

  private clampTargetRow(row: number): number {
    const parsedRow = Number(row);
    if (!Number.isFinite(parsedRow)) {
      return 1;
    }

    return Math.min(Math.max(1, Math.trunc(parsedRow)), this.targetRowMax);
  }
}
