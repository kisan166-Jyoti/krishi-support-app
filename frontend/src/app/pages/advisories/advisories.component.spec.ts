import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AdvisoriesComponent } from './advisories.component';
import { AdvisoryService, Advisory } from '../../core/services/advisory.service';
import { CropService } from '../../core/services/crop.service';

const mockAdvisories: Advisory[] = [
  { id: 1, crop_id: 1, crop_name: 'Wheat', crop_icon: '🌾', title: 'Wheat Rust', type: 'disease', summary: 'Yellow rust', symptoms: '', cause: '', solution: '', severity: 'high', created_at: '' },
  { id: 2, crop_id: 1, crop_name: 'Wheat', crop_icon: '🌾', title: 'Aphids', type: 'pest', summary: 'Sap sucking', symptoms: '', cause: '', solution: '', severity: 'medium', created_at: '' },
  { id: 3, crop_id: 2, crop_name: 'Rice', crop_icon: '🌾', title: 'Rice Blast', type: 'disease', summary: 'Fungal blast', symptoms: '', cause: '', solution: '', severity: 'high', created_at: '' },
];

describe('AdvisoriesComponent', () => {
  let fixture: ComponentFixture<AdvisoriesComponent>;
  let component: AdvisoriesComponent;
  let advisoryServiceSpy: jasmine.SpyObj<AdvisoryService>;
  let cropServiceSpy: jasmine.SpyObj<CropService>;

  beforeEach(async () => {
    advisoryServiceSpy = jasmine.createSpyObj('AdvisoryService', ['getAll']);
    cropServiceSpy     = jasmine.createSpyObj('CropService', ['getAll']);

    advisoryServiceSpy.getAll.and.returnValue(of(mockAdvisories));
    cropServiceSpy.getAll.and.returnValue(of([
      { id: 1, name: 'Wheat', icon: '🌾', description: '' },
      { id: 2, name: 'Rice',  icon: '🌾', description: '' },
    ]));

    await TestBed.configureTestingModule({
      imports: [AdvisoriesComponent],
      providers: [
        provideRouter([]),
        { provide: AdvisoryService, useValue: advisoryServiceSpy },
        { provide: CropService,     useValue: cropServiceSpy },
        { provide: ActivatedRoute,  useValue: { queryParams: of({}) } },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(AdvisoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads all advisories on init', () => {
    expect(component.allAdvisories.length).toBe(3);
    expect(component.loading).toBeFalse();
  });

  it('applySearch filters by title', () => {
    component.searchQuery = 'rust';
    component.applySearch();
    expect(component.advisories.length).toBe(1);
    expect(component.advisories[0].title).toBe('Wheat Rust');
  });

  it('applySearch filters by crop_name', () => {
    component.searchQuery = 'rice';
    component.applySearch();
    expect(component.advisories.length).toBe(1);
    expect(component.advisories[0].crop_name).toBe('Rice');
  });

  it('applySearch returns all when query is empty', () => {
    component.searchQuery = '';
    component.applySearch();
    expect(component.advisories.length).toBe(3);
  });

  it('getSeverityClass returns correct CSS class', () => {
    expect(component.getSeverityClass('high')).toBe('severity-high');
    expect(component.getSeverityClass('low')).toBe('severity-low');
  });

  it('getTypeIcon returns correct emoji', () => {
    expect(component.getTypeIcon('disease')).toBe('🦠');
    expect(component.getTypeIcon('pest')).toBe('🐛');
    expect(component.getTypeIcon('management')).toBe('🌿');
    expect(component.getTypeIcon('unknown')).toBe('📋');
  });

  it('clearFilters resets all filter fields', () => {
    component.selectedCropId = 1;
    component.selectedType = 'pest';
    component.searchQuery = 'aphid';
    component.clearFilters();
    expect(component.selectedCropId).toBeNull();
    expect(component.selectedType).toBe('');
    expect(component.searchQuery).toBe('');
  });
});
