import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QueryService } from '../../core/services/query.service';
import { CropService, Crop } from '../../core/services/crop.service';

@Component({
  selector: 'app-ask-expert',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ask-expert.component.html',
  styleUrl: './ask-expert.component.css'
})
export class AskExpertComponent implements OnInit {
  crops: Crop[] = [];
  form = {
    farmer_name: '',
    crop_id: null as number | null,
    question: ''
  };
  submitting = false;
  submitted = false;
  error = '';

  constructor(
    private queryService: QueryService,
    private cropService: CropService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.cropService.getAll().subscribe(crops => this.crops = crops);

    this.route.queryParams.subscribe(params => {
      if (params['cropId']) this.form.crop_id = +params['cropId'];
    });
  }

  onSubmit() {
    if (!this.form.farmer_name.trim() || !this.form.question.trim()) {
      this.error = 'Name and question are required.';
      return;
    }

    this.submitting = true;
    this.error = '';

    const payload = {
      farmer_name: this.form.farmer_name.trim(),
      crop_id: this.form.crop_id ?? undefined,
      question: this.form.question.trim()
    };

    this.queryService.submit(payload).subscribe({
      next: () => { this.submitted = true; this.submitting = false; },
      error: () => {
        this.error = 'Failed to submit. Please try again.';
        this.submitting = false;
      }
    });
  }

  resetForm() {
    this.form = { farmer_name: '', crop_id: null, question: '' };
    this.submitted = false;
    this.error = '';
  }
}
