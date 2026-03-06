import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdvisoryService, Advisory } from '../../core/services/advisory.service';

@Component({
  selector: 'app-advisory-detail',
  imports: [CommonModule, RouterLink],
  templateUrl: './advisory-detail.component.html',
  styleUrl: './advisory-detail.component.css'
})
export class AdvisoryDetailComponent implements OnInit {
  advisory: Advisory | null = null;
  loading = true;
  error = false;

  constructor(
    private advisoryService: AdvisoryService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/advisories']); return; }

    this.advisoryService.getById(+id).subscribe({
      next: (data) => { this.advisory = data; this.loading = false; },
      error: () => { this.error = true; this.loading = false; }
    });
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = { disease: '🦠', pest: '🐛', management: '🌿' };
    return icons[type] || '📋';
  }
}
