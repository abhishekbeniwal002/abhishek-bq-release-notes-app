document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('refresh-btn');
    const spinnerIcon = document.getElementById('spinner-icon');
    const exportBtn = document.getElementById('export-btn');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const loader = document.getElementById('loader');
    const notesContainer = document.getElementById('notes-container');
    const errorContainer = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    let currentNotes = [];

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        themeIcon.className = 'fa-regular fa-moon';
    }

    // Fetch on initial load
    fetchNotes();

    refreshBtn.addEventListener('click', fetchNotes);
    exportBtn.addEventListener('click', exportToCSV);
    themeToggleBtn.addEventListener('click', toggleTheme);

    async function fetchNotes() {
        setLoadingState(true);

        try {
            const response = await fetch('/api/notes');
            const data = await response.json();

            if (data.status === 'success') {
                currentNotes = data.data;
                renderNotes(data.data);
                if (currentNotes.length > 0) {
                    exportBtn.classList.remove('hidden');
                }
            } else {
                currentNotes = [];
                exportBtn.classList.add('hidden');
                showError(data.message || 'Failed to fetch release notes.');
            }
        } catch (err) {
            currentNotes = [];
            exportBtn.classList.add('hidden');
            showError('Network error or server unreachable.');
        } finally {
            setLoadingState(false);
        }
    }

    function setLoadingState(isLoading) {
        if (isLoading) {
            refreshBtn.disabled = true;
            exportBtn.disabled = true;
            spinnerIcon.classList.add('spin');
            notesContainer.classList.add('hidden');
            errorContainer.classList.add('hidden');
            loader.classList.remove('hidden');
        } else {
            refreshBtn.disabled = false;
            exportBtn.disabled = false;
            spinnerIcon.classList.remove('spin');
            loader.classList.add('hidden');
        }
    }

    function showError(message) {
        errorText.textContent = message;
        errorContainer.classList.remove('hidden');
        notesContainer.classList.add('hidden');
    }

    function renderNotes(notes) {
        notesContainer.innerHTML = '';
        
        if (!notes || notes.length === 0) {
            notesContainer.innerHTML = `
                <div class="note-card" style="text-align: center;">
                    <p>No release notes found.</p>
                </div>
            `;
            notesContainer.classList.remove('hidden');
            return;
        }

        notes.forEach((note, index) => {
            const dateObj = new Date(note.published);
            const dateString = dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Extract plain text for tweet (first 100 chars of title or content)
            const tmpDiv = document.createElement('div');
            tmpDiv.innerHTML = note.title;
            const plainTitle = tmpDiv.textContent || tmpDiv.innerText || '';
            
            // Generate Twitter URL
            const tweetText = encodeURIComponent(`Check out this BigQuery update: ${plainTitle}`);
            const tweetUrl = encodeURIComponent(note.link || 'https://cloud.google.com/bigquery/docs/release-notes');
            const twitterIntent = `https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}&hashtags=BigQuery,GoogleCloud`;

            const card = document.createElement('div');
            card.className = 'note-card';
            card.style.animationDelay = `${index * 0.05}s`;

            card.innerHTML = `
                <div class="note-header">
                    <div>
                        <h2 class="note-title">${note.title}</h2>
                        <div class="note-date">
                            <i class="fa-regular fa-calendar"></i>
                            <span>${dateString !== 'Invalid Date' ? dateString : note.published}</span>
                        </div>
                    </div>
                    <div class="note-actions">
                        <button class="btn btn-copy" title="Copy to Clipboard">
                            <i class="fa-regular fa-copy"></i>
                            <span>Copy</span>
                        </button>
                        <a href="${twitterIntent}" target="_blank" rel="noopener noreferrer" class="btn btn-tweet" title="Share on X (Twitter)">
                            <i class="fa-brands fa-twitter"></i>
                            <span>Tweet</span>
                        </a>
                    </div>
                </div>
                <div class="note-content">
                    ${note.content}
                </div>
            `;

            const copyBtn = card.querySelector('.btn-copy');
            copyBtn.addEventListener('click', () => {
                const contentDiv = document.createElement('div');
                contentDiv.innerHTML = note.content;
                const plainContent = contentDiv.textContent || contentDiv.innerText || '';
                
                const textToCopy = `${plainTitle}\nDate: ${dateString !== 'Invalid Date' ? dateString : note.published}\n\n${plainContent}`;
                
                navigator.clipboard.writeText(textToCopy).then(() => {
                    const icon = copyBtn.querySelector('i');
                    const text = copyBtn.querySelector('span');
                    
                    icon.className = 'fa-solid fa-check';
                    text.textContent = 'Copied!';
                    copyBtn.classList.add('copied');
                    
                    setTimeout(() => {
                        icon.className = 'fa-regular fa-copy';
                        text.textContent = 'Copy';
                        copyBtn.classList.remove('copied');
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy: ', err);
                });
            });

            notesContainer.appendChild(card);
        });

        notesContainer.classList.remove('hidden');
    }

    function exportToCSV() {
        if (!currentNotes || currentNotes.length === 0) return;

        const headers = ['Title', 'Published Date', 'Link', 'Content Summary'];
        
        const rows = currentNotes.map(note => {
            const tmpDiv = document.createElement('div');
            tmpDiv.innerHTML = note.content;
            const plainContent = tmpDiv.textContent || tmpDiv.innerText || '';
            
            const dateObj = new Date(note.published);
            const dateString = dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const displayDate = dateString !== 'Invalid Date' ? dateString : note.published;

            return [
                note.title,
                displayDate,
                note.link,
                plainContent
            ].map(val => {
                const escaped = (val || '').replace(/"/g, '""');
                return `"${escaped}"`;
            }).join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `bigquery_release_notes_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function toggleTheme() {
        if (document.body.classList.contains('light-theme')) {
            document.body.classList.remove('light-theme');
            themeIcon.className = 'fa-regular fa-sun';
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.add('light-theme');
            themeIcon.className = 'fa-regular fa-moon';
            localStorage.setItem('theme', 'light');
        }
    }
});
