Implementation Plan:
- clean up inherited code: have a properly styled, designed webpage DONE
    - learned about THREE.js
    - removed controller on the top right corner
    - added title and subtitle to top left corner
    - moved country name to bottom left
    - updated overall aesthetics
- implement backend + connect to SVG
- 


relational database design notes: 
(*) indicates primary key
(F) indicates foreign key

TABLE 1: States (2015)
state_id    state_name      total_yes   total_no    total_abs   total_no_vote
...


TABLE 2: Resolutions (2015)
resolution_id   yes_vote    no_vote     abstain_vote    no_vote
...


TABLE 3: Votes
vote_id     resolution_id   state_id    vote
...