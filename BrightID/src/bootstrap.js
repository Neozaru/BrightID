// @flow
import { bootstrapAndUpgrade } from './versions';
import { resetOperations } from './actions';
import { store } from './store';
import { checkTasks, syncStoreTasks } from './components/Tasks/TasksSlice';

// happens inside of the loading screen

export const bootstrap = async () => {
  try {
    let {
      user: { publicKey },
    } = store.getState();
    // load redux store from async storage and upgrade async storage is necessary
    if (!publicKey) await bootstrapAndUpgrade();
    // reset operations
    store.dispatch(resetOperations());
    // fetch user info
    if (!publicKey) {
      publicKey = store.getState().user.publicKey;
      console.log('secondBootstrap', publicKey);
    }

    // update available usertasks
    store.dispatch(syncStoreTasks());
    // Initial check for completed tasks
    store.dispatch(checkTasks());

    // once everything is set up
    // this.props.navigation.navigate(publicKey ? 'App' : 'Onboarding');
  } catch (err) {
    console.log(err);
  }
};
