import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HomeComponent } from './home.component';
import { CropService } from '../../core/services/crop.service';
import { AdvisoryService, Advisory } from '../../core/services/advisory.service';

const mockCrops = [
  { id: 1, name: 'Wheat', icon: '🌾', description: 'A cereal crop.' },
  { id: 2, name: 'Rice',  icon: '🌾', description: 'A paddy crop.' },
];

const mockAdvisories: Advisory[] = [
  { id: 1, crop_id: 1, crop_name: 'Wheat', crop_icon: '🌾', title: 'Rust', type: 'disease', summary: '', symptoms: '', cause: '', solution: '', severity: 'high', created_at: '' },
  { id: 2, crop_id: 1, crop_name: 'Wheat', crop_icon: '🌾', title: 'Aphids', type: 'pest', summary: '', symptoms: '', cause: '', solution: '', severity: 'medium', created_at: '' },
];

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;
  let cropServiceSpy: jasmine.SpyObj<CropService>;
  let advisoryServiceSpy: jasmine.SpyObj<AdvisoryService>;
  let router: Router;

  beforeEach(async () => {
    cropServiceSpy     = jasmine.createSpyObj('CropService',     ['getAll']);
    advisoryServiceSpy = jasmine.createSpyObj('AdvisoryService', ['getAll']);

    cropServiceSpy.getAll.and.returnValue(of(mockCrops));
    advisoryServiceSpy.getAll.and.returnValue(of(mockAdvisories));

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: CropService,     useValue: cropServiceSpy },
        { provide: AdvisoryService, useValue: advisoryServiceSpy },
      ],
    }).compileComponents();

    router  = TestBed.inject(Router);
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads crops and advisories on init', () => {
    fixture.detectChanges();
    expect(component.crops.length).toBe(2);
    expect(component.loading).toBeFalse();
    expect(component.error).toBeFalse();
  });

  it('calculates advisory count per crop', () => {
    fixture.detectChanges();
    expect(component.advisoryCount[1]).toBe(2);
    expect(component.advisoryCount[2]).toBeUndefined();
  });

  it('sets error flag when data loading fails', () => {
    cropServiceSpy.getAll.and.returnValue(throwError(() => new Error('Network error')));
    fixture.detectChanges();
    expect(component.error).toBeTrue();
    expect(component.loading).toBeFalse();
  });

  it('viewAdvisories navigates to /advisories with cropId', () => {
    spyOn(router, 'navigate');
    fixture.detectChanges();
    component.viewAdvisories(1);
    expect(router.navigate).toHaveBeenCalledWith(['/advisories'], { queryParams: { cropId: 1 } });
  });
});
