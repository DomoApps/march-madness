import { AppCtrl } from '../controllers';
import { TeamService, Analytics } from '../services';
import { SELECTORS, TEAM_NAME, HOME_ID, AWAY_ID } from '../utils/constants';

const toggleDropdown = () => (evt) => {
  const dm = (typeof evt.target !== 'undefined')
    ? evt.target.parentNode.parentNode.querySelector(SELECTORS.dropdownContent)
    : evt.parentNode;

  dm.classList.toggle('open');
}

const handleTeamSelect = () => (evt) => {
  AppCtrl.toggleLoading();

  const name = evt.target.innerText;
  const id = evt.target.parentElement.getAttribute('for');

  return TeamService.getTeamStats(name, id === HOME_ID)
    .then((team) => updateTeam(id)(team))
    .then(() => {
      AppCtrl.toggleLoading();
      toggleDropdown()(evt.target.parentNode);

      if (Analytics.isReady()) runHeadToHead();
    })
    .catch(AppCtrl.toggleLoading);
}

const handleTeamSearch = () => (e) => {
  const qs = e.target.value;
  const dd = e.target.parentElement.parentElement.querySelector('.items');

  TeamService
    .filterTeamList(qs)
    .then(teams => updateTeamMenu(dd)(teams));
}

const updateTeam = (id) => {
  const el = document.getElementById(id);

  return (team) => {
    const title = el.querySelector(SELECTORS.teamTitle);
    const stats = el.querySelector(SELECTORS.teamStats);
    const btn = el.querySelector(SELECTORS.teamButton);

    btn.disabled = false;

    title.innerText = team.team;
    stats.innerHTML = Object.keys(team)
      .filter(key => key !== TEAM_NAME)
      .map(key => (
        `<div class="stat" data-stat=${key}>${key}
          <span class="value">${team[key]}</span>
        </div>`
      ))
      .join('');

    return;
  }
}

const updateTeamMenu = (menu) => {
  menu.innerHTML = null;

  return (teams) => {
    teams.forEach((team) => {
      const item = document.createElement('div');
      item.className = 'item';
      item.innerHTML = team;
      item.addEventListener('click', handleTeamSelect());
      menu.appendChild(item);
    });
  }
}

const runHeadToHead = () => {
  AppCtrl.toggleLoading();

  return (
    Analytics.run()
      .then(updateTeamStats)
      .then(findWinningTeam)
      .then(() => AppCtrl.toggleLoading())
      .catch(() => AppCtrl.toggleLoading())
  );
}

const updateTeamStats = (results) => results.map(updateTeamStat);

const updateTeamStat = (stat) => {
  const stats = document.querySelectorAll(SELECTORS.teamStat(stat.stat));

  stat.results.forEach((win, index) => {
    if (win) {
      stats[index].classList.add(SELECTORS.winningTeam);
    } else {
      stats[index].classList.remove(SELECTORS.winningTeam);
    }
  });

  return stat;
}

const findWinningTeam = (results) => {
  if (Analytics.homeWinner(results)) {
    document.getElementById(HOME_ID).classList.add(SELECTORS.winningTeam);
    document.getElementById(AWAY_ID).classList.remove(SELECTORS.winningTeam);
  } else {
    document.getElementById(HOME_ID).classList.remove(SELECTORS.winningTeam);
    document.getElementById(AWAY_ID).classList.add(SELECTORS.winningTeam);
  }

  return;
}

module.exports = {
  runHeadToHead,
  handleTeamSearch,
  toggleDropdown,
  updateTeamMenu,
};
