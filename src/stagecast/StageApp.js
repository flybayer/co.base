import { createFullscreenSwitchNavigator } from '@aven/navigation-web';
import { createAuthNavigator } from '@aven/auth';
import { createContentPage } from '@aven/content';
import SimplePage from './SimplePage';
import HomeScreen from './HomeScreen';
import EventScreen from './EventScreen';
import OrgScreen from './OrgScreen';
import ProfileScreen from './ProfileScreen';
import StageScreen from './StageScreen';
import NewOrgScreen from './NewOrgScreen';

function authRedirectScreen(AuthenticatedPage) {
  // todo, wrap with component with redirecting effect for logged-out users
  return AuthenticatedPage;
}

export default createFullscreenSwitchNavigator({
  Home: {
    path: '',
    screen: HomeScreen,
  },
  Org: {
    path: 'o/:orgId',
    screen: OrgScreen,
  },
  NewOrg: {
    path: 'new-org',
    screen: authRedirectScreen(NewOrgScreen),
  },
  Stage: {
    path: 'o/:orgId/s/:stageId',
    screen: StageScreen,
  },
  Profile: {
    path: 'profile',
    screen: authRedirectScreen(ProfileScreen),
  },
  Event: {
    path: 'o/:orgId/e/:eventId',
    screen: EventScreen,
  },
  Auth: {
    path: 'auth',
    screen: createAuthNavigator(SimplePage),
  },
  LegalTerms: {
    path: 'legal/terms',
    screen: createContentPage(SimplePage, 'Content/LegalTerms'),
  },
  LegalPrivacy: {
    path: 'legal/privacy',
    screen: createContentPage(SimplePage, 'Content/LegalPrivacy'),
  },
});
