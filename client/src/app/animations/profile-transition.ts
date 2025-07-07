import { Animation, createAnimation } from '@ionic/angular';

export const profileTransition = (baseEl: HTMLElement): Animation => {
  return createAnimation()
    .addElement(baseEl)
    .duration(400) // Slightly longer duration
    .easing('cubic-bezier(0.25,0.8,0.25,1)') // Different easing
    .fromTo('opacity', '0', '1')
    .fromTo('transform', 'scale(0.95)', 'scale(1)'); // Original scale effect
};