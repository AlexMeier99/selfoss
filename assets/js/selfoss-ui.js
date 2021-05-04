import React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import ReactDOM from 'react-dom';
import locales from './locales';
import selfoss from './selfoss-base';
import App from './templates/App';
import { LoadingState } from './requests/LoadingState';

/**
 * Creates the selfoss single-page application
 * with the required contexts.
 */
function createApp(appRef) {
    return (
        <Router hashType="noslash">
            <App ref={appRef} />
        </Router>
    );
}

/**
 * ui change functions
 */
selfoss.ui = {
    /**
     * Create basic DOM structure of the page.
     */
    init: function() {
        document.getElementById('js-loading-message')?.remove();

        const mainUi = document.createElement('div');
        document.body.appendChild(mainUi);
        mainUi.classList.add('app-toplevel');

        ReactDOM.render(
            createApp((app) => {
                selfoss.app = app;
            }),
            mainUi
        );

        // Cannot add these to the append above, since jQuery automatically cache-busts links, which would prevent them from loading off-line.
        if (selfoss.config.userCss !== null) {
            let link = document.createElement('link');
            link.setAttribute('rel', 'stylesheet');
            link.setAttribute('href', `user.css?v=${selfoss.config.userCss}`);
            document.head.appendChild(link);
        }
        if (selfoss.config.userJs !== null) {
            let script = document.createElement('script');
            script.setAttribute('src', `user.js?v=${selfoss.config.userJs}`);
            document.body.appendChild(script);
        }


        selfoss.tags.addEventListener('change', () => {
            if (selfoss.entriesPage) {
                const tag = selfoss.entriesPage.getActiveTag();
                if (tag !== null && !selfoss.db.isValidTag(tag)) {
                    selfoss.ui.showError(selfoss.ui._('error_unknown_tag') + ' ' + tag);
                }
            }
        });

        selfoss.sources.addEventListener('change', () => {
            if (selfoss.entriesPage) {
                const source = selfoss.entriesPage.getActiveSource();
                if (source !== null && !selfoss.db.isValidSource(source)) {
                    selfoss.ui.showError(selfoss.ui._('error_unknown_source') + ' ' + source);
                }
            }

            selfoss.sources.setState(LoadingState.SUCCESS);
            if (document.querySelector('#nav-sources-title').classList.contains('nav-sources-collapsed')) {
                document.querySelector('#nav-sources-title').click(); // expand sources nav
            }
        });

        function loggedinChanged(event) {
            document.body.classList.toggle('loggedin', event.value);
        }
        // It might happen that the value changes before event handler is attached.
        loggedinChanged({ value: selfoss.loggedin.value });
        selfoss.loggedin.addEventListener('change', loggedinChanged);
    },

    showLogin: function(error = '') {
        selfoss.history.push('/login');
        selfoss.ui.refreshTitle(0);
        // TODO: Use location state once we switch to BrowserRouter
        selfoss.app.setLoginFormError(error);
        document.querySelector('#username').focus();
    },


    refreshTitle: function(unread) {
        unread = (typeof unread !== 'undefined') ? unread : selfoss.app.state.unreadItemsCount;

        if (unread > 0) {
            document.title = selfoss.htmlTitle + ' (' + unread + ')';
        } else {
            document.title = selfoss.htmlTitle;
        }
    },


    setOffline: function() {
        selfoss.app.setOfflineState(true);
    },


    setOnline: function() {
        selfoss.app.setOfflineState(false);
    },


    /**
     * Expand given entries.
     * @param {number} id of entry
     */
    entryExpand: function(entry) {
        if (!entry) {
            return;
        }

        selfoss.entriesPage.setEntryExpanded(entry, true);
    },


    /**
     * Collapse given entries.
     * @param {number} id of entry
     */
    entryCollapse: function(entry) {
        if (!entry) {
            return;
        }

        selfoss.entriesPage.setEntryExpanded(entry, false);
    },


    /**
     * Collapse all expanded entries.
     */
    entryCollapseAll: function() {
        selfoss.entriesPage.setExpandedEntries({});
    },


    /**
     * Is given entry expanded?
     * @param {number} id of entry to check
     * @return {bool} whether it is expanded
     */
    entryIsExpanded: function(entry) {
        return selfoss.entriesPage.state.expandedEntries[entry] ?? false;
    },


    /**
     * Toggle expanded state of given entry.
     * @param {number} id of entry to toggle
     */
    entryToggleExpanded: function(entry) {
        if (!entry) {
            return;
        }

        selfoss.entriesPage.setEntryExpanded(entry, (expanded) => !(expanded ?? false));
    },


    /**
     * Activate entry as if it were clicked.
     * This will open it, focus it and based on the settings, mark it as read.
     * @param {number} id of entry
     */
    entryActivate: function(id) {
        const entry = document.querySelector(`.entry[data-entry-id="${id}"]`);

        if (!selfoss.ui.entryIsExpanded(id)) {
            entry.querySelector('.entry-title > .entry-title-link').click();
        }
    },


    /**
     * Deactivate entry, as if it were clicked.
     * This will close it and maybe something more.
     * @param {number} id of entry
     */
    entryDeactivate: function(id) {
        const entry = document.querySelector(`.entry[data-entry-id="${id}"]`);

        if (selfoss.ui.entryIsExpanded(id)) {
            entry.querySelector('.entry-title > .entry-title-link').click();
        }
    },


    /**
     * Make the given entry currently selected one.
     * @param {number} id of entry to select
     */
    entrySelect: function(entry) {
        selfoss.entriesPage.setSelectedEntry(entry);
    },


    /**
     * Get the currently selected entry.
     * @return {number}
     */
    entryGetSelected: function() {
        return selfoss.entriesPage.state.selectedEntry;
    },


    entryStar: function(id, starred) {
        selfoss.entriesPage.setEntries((entries) =>
            entries.map((entry) => {
                if (entry.id === id) {
                    return {
                        ...entry,
                        starred
                    };
                } else {
                    return entry;
                }
            })
        );
    },


    entryMark: function(id, unread) {
        selfoss.entriesPage.setEntries((entries) =>
            entries.map((entry) => {
                if (entry.id === id) {
                    return {
                        ...entry,
                        unread
                    };
                } else {
                    return entry;
                }
            })
        );
    },


    refreshEntryStatuses: function(entryStatuses) {
        selfoss.entriesPage.state.entries.forEach((entry) => {
            const { id } = entry;
            var newStatus = false;
            entryStatuses.some(function(entryStatus) {
                if (entryStatus.id == id) {
                    newStatus = entryStatus;
                }
                return newStatus;
            });
            if (newStatus) {
                selfoss.ui.entryStar(id, newStatus.starred);
                selfoss.ui.entryMark(id, newStatus.unread);
            }
        });
    },


    /*
     * This is a naive and partial implementation for parsing the
     * local-aware formatted strings from the Fat-Free Framework.
     * The full spec is at https://fatfreeframework.com/3.6/base#format and is
     * not fully implemented.
     */
    i18nFormat: function(translated, params) {
        var formatted = '';

        var curChar = undefined;
        var buffer = '';

        var state = 'out';
        var placeholder = undefined;
        var plural = undefined;
        var pluralKeyword = undefined;
        var pluralValue = undefined;

        for (var i = 0, len = translated.length; i < len; i++) {
            curChar = translated.charAt(i);
            switch (curChar) {
            case '{':
                if (placeholder) {
                    if (state == 'plural') {
                        pluralKeyword = buffer.trim();
                        if (['zero', 'one', 'other'].includes(pluralKeyword)) {
                            buffer = '';
                        } else {
                            pluralKeyword = undefined;
                        }
                    }
                } else {
                    formatted = formatted + buffer;
                    buffer = '';
                    placeholder = {};
                    state = 'index';
                }
                break;
            case '}':
            case ',':
                if (placeholder) {
                    if (state == 'index') {
                        placeholder.index = parseInt(buffer.trim());
                        placeholder.value = params[placeholder.index];
                        buffer = '';
                    } else if (state == 'type') {
                        placeholder.type = buffer.trim();
                        buffer = '';
                        if (placeholder.type == 'plural') {
                            plural = {};
                            state = 'plural';
                        }
                    }
                    if (curChar == '}') {
                        if (state == 'plural' && pluralKeyword) {
                            plural[pluralKeyword] = buffer;
                            buffer = '';
                            pluralKeyword = undefined;
                        } else if (plural) {
                            if ('zero' in plural
                                    && placeholder.value === 0) {
                                pluralValue = plural.zero;
                            } else if ('one' in plural
                                            && placeholder.value == 1) {
                                pluralValue = plural.one;
                            } else {
                                pluralValue = plural.other;
                            }
                            formatted = formatted + pluralValue.replace('#', placeholder.value);
                            plural = undefined;
                            placeholder = undefined;
                            state = 'out';
                        } else {
                            formatted = formatted + placeholder.value;
                            placeholder = undefined;
                            state = 'out';
                        }
                    } else if (curChar == ',' && state == 'index') {
                        state = 'type';
                    }
                }
                break;
            default:
                buffer = buffer + curChar;
                break;
            }
        }

        if (state != 'out') {
            return 'Error formatting \'' + translated + '\', bug report?';
        }

        formatted = formatted + buffer;

        return formatted;
    },


    /**
    * Obtain a localized message for given key, substituting placeholders for values, when given.
    * @param string key
    * @param ?array parameters
    * @return string
    */
    _: function(identifier, params) {
        const fallbackLanguage = 'en';
        const langKey = `lang_${identifier}`;

        let preferredLanguage = selfoss.config.language;

        // locale auto-detection
        if (preferredLanguage === null) {
            if ('languages' in navigator) {
                preferredLanguage = navigator.languages.find(lang => Object.keys(locales).includes(lang));
            }
        }

        if (!Object.keys(locales).includes(preferredLanguage)) {
            preferredLanguage = fallbackLanguage;
        }

        let translated = locales[preferredLanguage][langKey] || locales[fallbackLanguage][langKey] || `#untranslated:${identifier}`;

        if (params) {
            translated = selfoss.ui.i18nFormat(translated, params);
        }

        return translated;
    },


    /**
     * Show error message in the message bar in the UI.
     *
     * @param {string} message
     * @return void
     */
    showError: function(message) {
        selfoss.ui.showMessage(message, [], true);
    },


    /**
     * Show message in the message bar in the UI.
     *
     * @param {string} message
     * @param {Array.<Object.{label: string, callback: function>} actions
     * @param {bool} isError
     * @return void
     */
    showMessage: function(message, actions = [], isError = false) {
        selfoss.app.setGlobalMessage({ message, actions, isError });
    },


    notifyNewVersion: function(cb) {
        if (!cb) {
            cb = function() {
                window.location.reload();
            };
        }

        selfoss.ui.showMessage(selfoss.ui._('app_update'), [
            {
                label: selfoss.ui._('app_reload'),
                callback: cb
            }
        ]);
    },


    refreshTagSourceUnread: function(tagCounts, sourceCounts, diff = true) {
        const tags = selfoss.tags.tags.map((tag) => {
            if (!(tag.tag in tagCounts)) {
                return tag;
            }

            let unread;
            if (diff) {
                unread = tag.unread + tagCounts[tag.tag];
            } else {
                unread = tagCounts[tag.tag];
            }

            return {
                ...tag,
                unread
            };
        });
        selfoss.tags.update(tags);

        if (selfoss.sources.sources.length > 0) {
            const sources = selfoss.sources.sources.map((source) => {
                if (!(source.id in sourceCounts)) {
                    return source;
                }

                let unread;
                if (diff) {
                    unread = source.unread + sourceCounts[source.id];
                } else {
                    unread = sourceCounts[source.id];
                }

                return {
                    ...source,
                    unread
                };
            });
            selfoss.sources.update(sources);
        }
    },


    refreshOfflineCounts: function(offlineCounts) {
        for (let [kind, newCount] of Object.entries(offlineCounts)) {
            if (newCount === 'keep') {
                continue;
            }

            if (kind === 'unread') {
                selfoss.app.setUnreadItemsOfflineCount(newCount);
            } else if (kind === 'starred') {
                selfoss.app.setStarredItemsOfflineCount(newCount);
            } else if (kind === 'newest') {
                selfoss.app.setAllItemsOfflineCount(newCount);
            }
        }
    }


};
