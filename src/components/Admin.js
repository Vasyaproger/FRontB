// // src/components/AddProduct.js
// import React, { useState } from 'react';
// import axios from 'axios';

// const AddProduct = () => {
//     const [name, setName] = useState('');
//     const [description, setDescription] = useState('');
//     const [price, setPrice] = useState('');
//     const [image, setImage] = useState(null);
//     const [error, setError] = useState('');

//     const handleSubmit = async (e) => {
//         e.preventDefault();

//         if (!name || !description || !price || !image) {
//             setError('Пожалуйста, заполните все поля');
//             return;
//         }

//         const formData = new FormData();
//         formData.append('name', name);
//         formData.append('description', description);
//         formData.append('price', price);
//         formData.append('image', image);

//         try {
//             const response = await axios.post('http://localhost:5001/api/products', formData, {
//                 headers: {
//                     'Content-Type': 'multipart/form-data',
//                 },
//             });
//             console.log(response.data);
//             setName('');
//             setDescription('');
//             setPrice('');
//             setImage(null);
//             setError('');
//         } catch (error) {
//             console.error('Ошибка добавления продукта:', error);
//             setError('Ошибка при добавлении продукта');
//         }
//     };

//     return (
//         <div>
//             <h2>Добавить новый продукт</h2>
//             <form onSubmit={handleSubmit}>
//                 <div>
//                     <label>Название:</label>
//                     <input
//                         type="text"
//                         value={name}
//                         onChange={(e) => setName(e.target.value)}
//                     />
//                 </div>
//                 <div>
//                     <label>Описание:</label>
//                     <textarea
//                         value={description}
//                         onChange={(e) => setDescription(e.target.value)}
//                     />
//                 </div>
//                 <div>
//                     <label>Цена:</label>
//                     <input
//                         type="number"
//                         value={price}
//                         onChange={(e) => setPrice(e.target.value)}
//                     />
//                 </div>
//                 <div>
//                     <label>Изображение:</label>
//                     <input
//                         type="file"
//                         accept="image/*"
//                         onChange={(e) => setImage(e.target.files[0])}
//                     />
//                 </div>
//                 {error && <p style={{ color: 'red' }}>{error}</p>}
//                 <button type="submit">Добавить продукт</button>
//             </form>
//         </div>
//     );
// };

// export default AddProduct;
