var enteredGame = false;

loading.update = function() {
    if (myInventory && !enteredGame) {
        this.scene.transition( {
            target: 'GameScene',
            moveBelow: true
        });
    }

    setTimeout(() => {
        if (!myInventory && !enteredGame) {
            this.scene.transition( {
                target: 'LoginScene',
                moveBelow: true
            });
        }
    }, 5000);
    
};