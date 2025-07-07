import { Animation, createAnimation } from '@ionic/angular';

export const defaultTransition = (baseEl: HTMLElement): Animation => {
  return createAnimation()
    .addElement(baseEl)
    .duration(300)
    .easing('cubic-bezier(0.36,0.66,0.04,1)')
    .fromTo('opacity', '0', '1')
    .fromTo('transform', 'translateY(20px)', 'translateY(0)');
};