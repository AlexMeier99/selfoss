import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as icons from '../icons';
import { LocalizationContext } from '../helpers/i18n';

function handleReloadAll({ reloadAll, setReloading, setNavExpanded }) {
    setReloading(true);
    reloadAll().finally(() => {
        setNavExpanded(false);
        setReloading(false);
    });
}

function handleLogOut({ setNavExpanded }) {
    // only loggedin users
    if (!selfoss.loggedin.value || !selfoss.db.online) {
        return;
    }

    selfoss.db.clear();
    selfoss.logout();
    setNavExpanded(false);
}

export default function NavToolBar({ reloadAll, setNavExpanded }) {
    const [reloading, setReloading] = React.useState(false);

    const refreshOnClick = React.useCallback(
        () => handleReloadAll({ reloadAll, setReloading, setNavExpanded }),
        [reloadAll, setNavExpanded]
    );

    const settingsOnClick = React.useCallback(
        () => {
            setNavExpanded(false);
        },
        [setNavExpanded]
    );

    const logoutOnClick = React.useCallback(
        () => handleLogOut({ setNavExpanded }),
        [setNavExpanded]
    );

    const _ = React.useContext(LocalizationContext);

    return (
        <div className="nav-toolbar">
            <button
                id="nav-refresh"
                title={_('refreshbutton')}
                aria-label={_('refreshbutton')}
                accessKey="r"
                onClick={refreshOnClick}
            >
                <FontAwesomeIcon
                    icon={icons.reload}
                    fixedWidth
                    spin={reloading}
                />
            </button>
            <Link
                id="nav-settings"
                title={_('settingsbutton')}
                aria-label={_('settingsbutton')}
                accessKey="t"
                to="/manage/sources"
                onClick={settingsOnClick}
            >
                <FontAwesomeIcon
                    icon={icons.settings}
                    fixedWidth
                />
            </Link>
            <button
                id="nav-logout"
                title={_('logoutbutton')}
                aria-label={_('logoutbutton')}
                accessKey="l"
                onClick={logoutOnClick}
            >
                <FontAwesomeIcon icon={icons.signOut} fixedWidth />
            </button>
            <Link
                id="nav-login"
                title={_('loginbutton')}
                aria-label={_('loginbutton')}
                accessKey="l"
                to="/sign/in"
            >
                <FontAwesomeIcon icon={icons.logIn} fixedWidth />
            </Link>
        </div>
    );
}

NavToolBar.propTypes = {
    reloadAll: PropTypes.func.isRequired,
    setNavExpanded: PropTypes.func.isRequired,
};
