class RouletteApp {
    constructor() {
        this.canvas = document.getElementById('rouletteCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.startBtn = document.getElementById('startBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.addItemBtn = document.getElementById('addItemBtn');
        this.itemsList = document.getElementById('itemsList');
        this.resultText = document.getElementById('resultText');
        this.spinSound = document.getElementById('spinSound');
        
        this.items = [
            { id: 1, text: '1番', color: '#FF6B6B' },
            { id: 2, text: '2番', color: '#4ECDC4' },
            { id: 3, text: '3番', color: '#45B7D1' },
            { id: 4, text: '4番', color: '#96CEB4' },
            { id: 5, text: '5番', color: '#FFEAA7' }
        ];
        
        this.isSpinning = false;
        this.currentRotation = 0;
        this.radius = 180;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.nextId = 6;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.renderItems();
        this.drawRoulette();
        this.createPopSound();
    }
    
    bindEvents() {
        this.startBtn.addEventListener('click', () => this.spin());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.addItemBtn.addEventListener('click', () => this.addItem());
        
        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.spin();
            } else if (e.code === 'KeyR') {
                this.reset();
            }
        });
    }
    
    addItem() {
        const newItem = {
            id: this.nextId++,
            text: `${this.items.length + 1}番`,
            color: this.getRandomColor()
        };
        this.items.push(newItem);
        this.renderItems();
        this.drawRoulette();
    }
    
    removeItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.renderItems();
        this.drawRoulette();
    }
    
    updateItem(id, text) {
        const item = this.items.find(item => item.id === id);
        if (item) {
            item.text = text || `${this.items.indexOf(item) + 1}番`;
            this.drawRoulette();
        }
    }
    
    renderItems() {
        this.itemsList.innerHTML = '';
        this.items.forEach((item, index) => {
            const itemRow = document.createElement('div');
            itemRow.className = 'item-row';
            itemRow.innerHTML = `
                <span class="item-number">${index + 1}.</span>
                <input type="text" class="item-input" value="${item.text}" 
                       onchange="app.updateItem(${item.id}, this.value)">
                <button class="item-remove" onclick="app.removeItem(${item.id})">×</button>
            `;
            this.itemsList.appendChild(itemRow);
        });
    }
    
    drawRoulette() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.items.length === 0) {
            this.drawEmptyState();
            return;
        }
        
        const anglePerItem = (2 * Math.PI) / this.items.length;
        
        this.items.forEach((item, index) => {
            // 項目を上部（-90度）から時計回りに配置
            const startAngle = index * anglePerItem + this.currentRotation - Math.PI / 2;
            const endAngle = (index + 1) * anglePerItem + this.currentRotation - Math.PI / 2;
            
            // セクター描画
            this.ctx.beginPath();
            this.ctx.moveTo(this.centerX, this.centerY);
            this.ctx.arc(this.centerX, this.centerY, this.radius, startAngle, endAngle);
            this.ctx.closePath();
            this.ctx.fillStyle = item.color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            // テキスト描画
            const textAngle = startAngle + anglePerItem / 2;
            const textX = this.centerX + Math.cos(textAngle) * (this.radius * 0.7);
            const textY = this.centerY + Math.sin(textAngle) * (this.radius * 0.7);
            
            this.ctx.save();
            this.ctx.translate(textX, textY);
            this.ctx.rotate(textAngle + Math.PI / 2);
            this.ctx.fillStyle = '#333';
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.strokeText(item.text, 0, 0);
            this.ctx.fillText(item.text, 0, 0);
            this.ctx.restore();
        });
        
        // 中央の円
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, 30, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#fff';
        this.ctx.fill();
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }
    
    drawEmptyState() {
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#999';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('項目を追加してください', this.centerX, this.centerY);
    }
    
    spin() {
        if (this.isSpinning || this.items.length === 0) return;
        
        this.isSpinning = true;
        this.startBtn.disabled = true;
        this.resultText.classList.remove('show');
        this.resultText.textContent = '';
        
        // ランダムな回転量を計算（最低3回転 + ランダム）
        const minRotations = 3;
        const extraRotation = Math.random() * 2 * Math.PI;
        const totalRotation = minRotations * 2 * Math.PI + extraRotation;
        
        // アニメーション実行
        this.animateRotation(totalRotation, 3000);
    }
    
    animateRotation(totalRotation, duration) {
        const startTime = Date.now();
        const startRotation = this.currentRotation;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // イージング関数（加速→減速）
            const eased = 1 - Math.pow(1 - progress, 3);
            
            this.currentRotation = startRotation + totalRotation * eased;
            this.drawRoulette();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.onSpinComplete();
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    onSpinComplete() {
        this.isSpinning = false;
        this.startBtn.disabled = false;
        
        // 当選項目を決定
        const normalizedRotation = ((this.currentRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const anglePerItem = (2 * Math.PI) / this.items.length;
        
        // ポインターは上部（12時方向）にあり、項目は上部から時計回りに配置
        // 回転後のポインターの位置から、どの項目を指しているかを計算
        // 回転は時計回りなので、回転角度を逆算してポインターが指す項目を見つける
        const pointerAngle = (2 * Math.PI - normalizedRotation) % (2 * Math.PI);
        const selectedIndex = Math.floor(pointerAngle / anglePerItem) % this.items.length;
        const selectedItem = this.items[selectedIndex];
        
        // 結果表示
        if (selectedItem) {
            this.showResult(selectedItem.text);
        }
    }
    
    showResult(text) {
        this.resultText.textContent = text;
        this.resultText.classList.add('show');
        this.playPopSound();
    }
    
    reset() {
        this.items = [
            { id: 1, text: '1番', color: '#FF6B6B' },
            { id: 2, text: '2番', color: '#4ECDC4' },
            { id: 3, text: '3番', color: '#45B7D1' },
            { id: 4, text: '4番', color: '#96CEB4' },
            { id: 5, text: '5番', color: '#FFEAA7' }
        ];
        this.nextId = 6;
        this.currentRotation = 0;
        this.resultText.classList.remove('show');
        this.resultText.textContent = '';
        this.renderItems();
        this.drawRoulette();
    }
    
    getRandomColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#A8E6CF', '#FFD3E1', '#C7CEEA',
            '#FF8A80', '#82B1FF', '#B9F6CA', '#FFCC02', '#FF7043'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    createPopSound() {
        // Web Audio API を使用した効果音生成
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.audioContext = audioContext;
    }
    
    playPopSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    window.app = new RouletteApp();
});