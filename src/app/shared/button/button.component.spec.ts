import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';
import { By } from '@angular/platform-browser';

describe('ButtonComponent', () => {
  let fixture: ComponentFixture<ButtonComponent>;
  let component: ButtonComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent as any);
    component = fixture.componentInstance as ButtonComponent;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders a button element with default attributes', () => {
    const btn = fixture.debugElement.query(By.css('button'));
    expect(btn).toBeTruthy();
    expect(btn.nativeElement.getAttribute('type')).toBe('button');
    expect(btn.nativeElement.classList).toContain('btn-primary');
  });

  it('applies variant and disabled inputs', () => {
    component.variant = 'secondary';
    component.disabled = true;
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('button'));
    expect(btn.nativeElement.classList).toContain('btn-secondary');
    expect(btn.nativeElement.disabled).toBeTrue();
  });

  it('shows loader when loading is true', () => {
    component.loading = true;
    fixture.detectChanges();
    const loader = fixture.debugElement.query(By.css('app-loader'));
    expect(loader).toBeTruthy();
  });

  it('emits click events when enabled', () => {
    const btn = fixture.debugElement.query(By.css('button'));
    spyOn(btn.nativeElement, 'click');
    btn.nativeElement.click();
    expect(btn.nativeElement.click).toHaveBeenCalled();
  });
});
