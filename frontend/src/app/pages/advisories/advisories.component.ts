import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdvisoryService, Advisory } from '../../core/services/advisory.service';
import { CropService, Crop } from '../../core/services/crop.service';

@Component({
  selector: 'app-advisories',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './advisories.component.html',
  styleUrl: './advisories.component.css'
})
export class AdvisoriesComponent implements OnInit {
  allAdvisories: Advisory[] = [];
  advisories: Advisory[] = [];
  crops: Crop[] = [];
  selectedCropId: number | null = null;
  selectedType: string = '';
  searchQuery: string = '';
  loading = true;

  constructor(
    private advisoryService: AdvisoryService,
    private cropService: CropService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.cropService.getAll().subscribe(crops => this.crops = crops);

    this.route.queryParams.subscribe(params => {
      this.selectedCropId = params['cropId'] ? +params['cropId'] : null;
      this.selectedType = params['type'] || '';
      this.loadAdvisories();
    });
  }

  loadAdvisories() {
    this.loading = true;
    this.advisoryService.getAll(
      this.selectedCropId ?? undefined,
      this.selectedType || undefined
    ).subscribe({
      next: (data) => {
        this.allAdvisories = data;
        this.applySearch();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applySearch() {
    const q = this.searchQuery.toLowerCase().trim();
    this.advisories = q
      ? this.allAdvisories.filter(a =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.crop_name.toLowerCase().includes(q)
        )
      : this.allAdvisories;
  }

  applyFilters() {
    const queryParams: Record<string, string> = {};
    if (this.selectedCropId) queryParams['cropId'] = String(this.selectedCropId);
    if (this.selectedType) queryParams['type'] = this.selectedType;
    this.router.navigate([], { queryParams });
  }

  clearFilters() {
    this.selectedCropId = null;
    this.selectedType = '';
    this.searchQuery = '';
    this.router.navigate([], { queryParams: {} });
  }

  getSeverityClass(severity: string): string {
    return `severity-${severity}`;
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = { disease: '🦠', pest: '🐛', management: '🌿' };
    return icons[type] || '📋';
  }
}
