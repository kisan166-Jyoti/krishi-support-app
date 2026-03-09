import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AdvisoryDetailComponent } from './advisory-detail.component';
import { AdvisoryService, Advisory } from '../../core/services/advisory.service';

const mockAdvisory: Advisory = {
  id: 1, crop_id: 1, crop_name: 'Wheat', crop_icon: '🌾',
  title: 'Wheat Rust', type: 'disease', summary: 'Yellow rust summary',
  symptoms: 'Yellow stripes', cause: 'Puccinia', solution: 'Apply fungicide',
  severity: 'high', created_at: '2024-01-01',
};

describe('AdvisoryDetailComponent', () => {
  let fixture: ComponentFixture<AdvisoryDetailComponent>;
  let component: AdvisoryDetailComponent;
  let advisoryServiceSpy: jasmine.SpyObj<AdvisoryService>;
  let router: Router;

  async function setup(id: string | null) {
    advisoryServiceSpy = jasmine.createSpyObj('AdvisoryService', ['getById']);

    await TestBed.resetTestingModule().configureTestingModule({
      imports: [AdvisoryDetailComponent],
      providers: [
        provideRouter([]),
        { provide: AdvisoryService, useValue: advisoryServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => id } } } },
      ],
    }).compileComponents();

    router    = TestBed.inject(Router);
    fixture   = TestBed.createComponent(AdvisoryDetailComponent);
    component = fixture.componentInstance;
  }

  it('should create', async () => {
    await setup('1');
    advisoryServiceSpy.getById.and.returnValue(of(mockAdvisory));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('loads the advisory by id', async () => {
    await setup('1');
    advisoryServiceSpy.getById.and.returnValue(of(mockAdvisory));
    fixture.detectChanges();
    expect(advisoryServiceSpy.getById).toHaveBeenCalledWith(1);
    expect(component.advisory).toEqual(mockAdvisory);
    expect(component.loading).toBeFalse();
  });

  it('sets error flag when advisory fetch fails', async () => {
    await setup('1');
    advisoryServiceSpy.getById.and.returnValue(throwError(() => new Error('Not found')));
    fixture.detectChanges();
    expect(component.error).toBeTrue();
    expect(component.loading).toBeFalse();
  });

  it('redirects to /advisories when id is missing', async () => {
    await setup(null);
    spyOn(router, 'navigate');
    fixture.detectChanges();
    expect(router.navigate).toHaveBeenCalledWith(['/advisories']);
  });

  it('getTypeIcon returns correct emoji', async () => {
    await setup('1');
    advisoryServiceSpy.getById.and.returnValue(of(mockAdvisory));
    fixture.detectChanges();
    expect(component.getTypeIcon('disease')).toBe('🦠');
    expect(component.getTypeIcon('pest')).toBe('🐛');
    expect(component.getTypeIcon('management')).toBe('🌿');
  });
});
