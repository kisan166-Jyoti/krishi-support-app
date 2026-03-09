import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AskExpertComponent } from './ask-expert.component';
import { QueryService } from '../../core/services/query.service';
import { CropService } from '../../core/services/crop.service';

const mockQueryResponse = {
  id: 1, farmer_name: 'Ramu', crop_id: null,
  question: 'Why are leaves yellow?', status: 'pending', submitted_at: '2024-01-01',
};

describe('AskExpertComponent', () => {
  let fixture: ComponentFixture<AskExpertComponent>;
  let component: AskExpertComponent;
  let queryServiceSpy: jasmine.SpyObj<QueryService>;
  let cropServiceSpy:  jasmine.SpyObj<CropService>;

  beforeEach(async () => {
    queryServiceSpy = jasmine.createSpyObj('QueryService', ['submit']);
    cropServiceSpy  = jasmine.createSpyObj('CropService',  ['getAll']);
    cropServiceSpy.getAll.and.returnValue(of([
      { id: 1, name: 'Wheat', icon: '🌾', description: '' },
    ]));

    await TestBed.configureTestingModule({
      imports: [AskExpertComponent],
      providers: [
        provideRouter([]),
        { provide: QueryService, useValue: queryServiceSpy },
        { provide: CropService,  useValue: cropServiceSpy },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(AskExpertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads crops on init', () => {
    expect(component.crops.length).toBe(1);
  });

  it('pre-fills crop_id from query params', async () => {
    const qSpy = jasmine.createSpyObj('QueryService', ['submit']);
    const cSpy = jasmine.createSpyObj('CropService', ['getAll']);
    cSpy.getAll.and.returnValue(of([{ id: 1, name: 'Wheat', icon: '🌾', description: '' }]));

    await TestBed.resetTestingModule().configureTestingModule({
      imports: [AskExpertComponent],
      providers: [
        provideRouter([]),
        { provide: QueryService,   useValue: qSpy },
        { provide: CropService,    useValue: cSpy },
        { provide: ActivatedRoute, useValue: { queryParams: of({ cropId: '2' }) } },
      ],
    }).compileComponents();
    const f = TestBed.createComponent(AskExpertComponent);
    f.detectChanges();
    expect(f.componentInstance.form.crop_id).toBe(2);
  });

  it('shows error when farmer_name is empty on submit', () => {
    component.form.farmer_name = '';
    component.form.question = 'Some question';
    component.onSubmit();
    expect(component.error).toBeTruthy();
    expect(queryServiceSpy.submit).not.toHaveBeenCalled();
  });

  it('shows error when question is empty on submit', () => {
    component.form.farmer_name = 'Ramu';
    component.form.question = '';
    component.onSubmit();
    expect(component.error).toBeTruthy();
    expect(queryServiceSpy.submit).not.toHaveBeenCalled();
  });

  it('submits the query when form is valid', () => {
    queryServiceSpy.submit.and.returnValue(of(mockQueryResponse));
    component.form.farmer_name = 'Ramu';
    component.form.question = 'Why are leaves yellow?';
    component.onSubmit();
    expect(queryServiceSpy.submit).toHaveBeenCalledWith({
      farmer_name: 'Ramu',
      question: 'Why are leaves yellow?',
      crop_id: undefined,
    });
    expect(component.submitted).toBeTrue();
  });

  it('sets error message when submission fails', () => {
    queryServiceSpy.submit.and.returnValue(throwError(() => new Error('Server error')));
    component.form.farmer_name = 'Ramu';
    component.form.question = 'Why are leaves yellow?';
    component.onSubmit();
    expect(component.error).toContain('Failed');
    expect(component.submitted).toBeFalse();
  });

  it('resetForm clears all form fields', () => {
    component.form.farmer_name = 'Ramu';
    component.form.question = 'Some question';
    component.submitted = true;
    component.error = 'Some error';
    component.resetForm();
    expect(component.form.farmer_name).toBe('');
    expect(component.form.question).toBe('');
    expect(component.submitted).toBeFalse();
    expect(component.error).toBe('');
  });
});
