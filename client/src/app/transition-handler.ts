import { Animation, NavOptions } from '@ionic/angular';
import { defaultTransition, profileTransition } from './animations';

export const customTransition = (opts: NavOptions): Animation => {
  const transition = opts.enteringEl.getAttribute('data-animation') === 'profileTransition' 
    ? profileTransition 
    : defaultTransition;

  return transition(opts.enteringEl);
};