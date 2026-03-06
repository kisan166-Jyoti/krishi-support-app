import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { CropService, Crop } from '../../core/services/crop.service';
import { AdvisoryService } from '../../core/services/advisory.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  crops: Crop[] = [];
  advisoryCount: Record<number, number> = {};
  loading = true;
  error = false;

  constructor(
    private cropService: CropService,
    private advisoryService: AdvisoryService,
    private router: Router
  ) {}

  ngOnInit() {
    forkJoin({
      crops: this.cropService.getAll(),
      advisories: this.advisoryService.getAll()
    }).subscribe({
      next: ({ crops, advisories }) => {
        this.crops = crops;
        advisories.forEach(a => {
          this.advisoryCount[a.crop_id] = (this.advisoryCount[a.crop_id] || 0) + 1;
        });
        this.loading = false;
      },
      error: () => { this.error = true; this.loading = false; }
    });
  }

  viewAdvisories(cropId: number) {
    this.router.navigate(['/advisories'], { queryParams: { cropId } });
  }
}
