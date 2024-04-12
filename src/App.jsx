import { createSignal, onMount } from 'solid-js';
import {
  Container,
  Stack,
  TextField,
  Typography,
  ThemeProvider,
  createTheme,
  CircularProgress,
  Button,
  Chip,
  Fade,
  Alert,
  Box,
} from '@suid/material';
import { lazy } from 'solid-js';
import './App.css';

const Chart = lazy(() => import('./Chart'));

const darkTheme = createTheme({
  typography: {
    h2: {
      fontWeight: 800,
    },
    fontFamily: [
      'Inter',
      'ui-sans-serif',
      'system-ui',
      'sans-serif',
      'Apple Color Emoji',
      'Segoe UI Emoji',
      'Segoe UI Symbol',
      'Noto Color Emoji',
    ],
  },
  palette: {
    mode: 'dark',
  },
});

function App() {
  // ALERTS
  const [show, setShow] = createSignal(false);
  const [message, setMessage] = createSignal('');
  const [messageType, setMessageType] = createSignal('');

  // LOGIC
  const [repos, setRepos] = createSignal([]);
  const [repo, setRepo] = createSignal('');

  async function addToRepos(url) {
    const currentRepos = repos();
    if (currentRepos.length >= 6) {
      return errorMessage(
        'Reached maximum amount of 5 repos allowed. Remove a repository from the current list'
      );
    }
    const regexPattern = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)$/;
    const matchResult = url.match(regexPattern);
    if (!matchResult) {
      return errorMessage(
        'Repo not a valid github repository link. Link must be in the form of "https://github.com/{user}/{repo}"'
      );
    }

    const username = matchResult[1];
    const repository = matchResult[2];

    const dupeRepo = currentRepos.find((rep) => rep.title === repository);
    if (dupeRepo) {
      return errorMessage('Repo already in list');
    }

    // add other api endpoints too
    const baseURL = `https://api.github.com/repos/${username}/${repository}`;

    const commitActivityAPI = `${baseURL}/stats/commit_activity`;
    const starsAPI = `${baseURL}/stargazers`;
    const watchingAPI = `${baseURL}/subscribers`;
    const response = await new Promise(async (resolve) => {
      let attempts = 1;
      let intervalId;
      let ghresponse = await fetch(commitActivityAPI);
      if (ghresponse.status === 200) return resolve(ghresponse);
      intervalId = setInterval(async () => {
        attempts++;
        console.log(`Attempt: ${attempts}`);
        let response = await fetch(commitActivityAPI);
        if (response.status == 200 || attempts === 3) {
          resolve(response);
          clearInterval(intervalId);
        }
      }, 2_000);
    });

    if (response.status === 403) {
      return errorMessage(
        'Exceeded rate limit for Github API. Add your github token to extend limit'
      );
    }

    if (response.status !== 200) {
      return errorMessage('Unable to retrieve repository data');
    }

    const data = await response.json();
    const mappedData = data.map((point) => {
      delete point.days;
      return point;
    });

    const repoData = {
      title: repository,
      data: mappedData,
    };
    successMessage(`Retrieved data from ${url}`);
    setRepos([...repos(), repoData]);
    setRepo('');
  }

  function successMessage(message) {
    setShow(true);
    setMessage(message);
    setMessageType('success');
  }

  function errorMessage(message) {
    setShow(true);
    setMessage(message);
    setMessageType('error');
  }

  function handleDelete(title) {
    setRepos(repos().filter((rep) => rep.title !== title));
  }

  onMount(() => {
    addToRepos('https://github.com/solidjs/solid');
  });

  return (
    <Container>
      <Stack gap={3}>
        <Typography variant="h2">Github Compare</Typography>
        <Box>
          <Typography variant="body1">
            Add a github repository link to see it's data on the graph
          </Typography>
        </Box>

        <Box displayRaw="flex" justifyContent="center">
          <TextField
            fullWidth={true}
            placeholder="https://github.com/facebook/react"
            label="Github Repo Link"
            value={repo()}
            onChange={(e) => setRepo(e.target.value)}
          />
          <Button variant="outlined" onClick={() => addToRepos(repo())}>
            Add
          </Button>
        </Box>

        <Suspense
          fallback={
            <Box displayRaw="flex" justifyContent="center">
              <CircularProgress />
            </Box>
          }
        >
          <Chart data={repos()} />
        </Suspense>
        <Box displayRaw="flex">
          <For each={repos()}>
            {(rep, i) => (
              <Chip
                label={rep.title}
                variant="outlined"
                onDelete={() => handleDelete(rep.title)}
              />
            )}
          </For>
        </Box>
      </Stack>
      <Alert variant="outlined" severity={messageType()}>
        {message()}
      </Alert>
    </Container>
  );
}

function AppWrapper() {
  return (
    <ThemeProvider theme={darkTheme}>
      <App />
    </ThemeProvider>
  );
}

export default AppWrapper;
