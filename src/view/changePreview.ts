import { Config } from '../config/interfaces';
import { Observer } from '../observable';


export class ChangePreview extends Observer<Config> {

	protected onStateChange(newState: Config): void {

		// TODO:
		// - if preview style changed
		// - get paragraph css should be included switch
		// - include in style list (if not exists)
		// - remove froms style lists (if unset)

		this.state = newState;
	}
}